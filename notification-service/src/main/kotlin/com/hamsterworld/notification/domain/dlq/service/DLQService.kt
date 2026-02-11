package com.hamsterworld.notification.domain.dlq.service

import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import com.hamsterworld.notification.app.dlq.request.DLQSearchRequest
import com.hamsterworld.notification.domain.dlq.model.DLQMessage
import com.hamsterworld.notification.domain.dlq.repository.DLQMessageRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import java.time.LocalDateTime

/**
 * DLQ Service
 *
 * DLQ 메시지 조회, 재처리, 상태 관리
 *
 * ## Progression Service 패턴 적용:
 * 1. **SearchRequest 기반 조회**: DLQSearchRequest 사용
 * 2. **List/Page 분리**: searchList(), searchPage()
 * 3. **단순 위임**: Controller에서 받은 요청을 Repository로 전달
 * 4. **비즈니스 로직**: 재처리, 상태 변경 등
 */
@Service
class DLQService(
    private val dlqMessageRepository: DLQMessageRepository,
    private val kafkaTemplate: KafkaTemplate<String, String>
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    // ===== 조회 (Progression Service 패턴) =====

    /**
     * 검색 조건 기반 조회 (List)
     *
     * Progression Service의 searchListDto() 패턴
     */
    fun searchList(search: DLQSearchRequest): List<DLQMessage> {
        return dlqMessageRepository.findAll(search)
    }

    /**
     * 검색 조건 기반 조회 (Page)
     *
     * Progression Service의 searchPageDto() 패턴
     */
    fun searchPage(search: DLQSearchRequest): Page<DLQMessage> {
        return dlqMessageRepository.findAllPage(search)
    }

    /**
     * ID로 단건 조회
     */
    fun getMessageById(id: String): DLQMessage? {
        return dlqMessageRepository.findById(id)
    }

    // ===== 통계 =====

    /**
     * PENDING 메시지 개수
     */
    fun getPendingCount(): Long {
        return dlqMessageRepository.countByStatus(DLQStatus.PENDING)
    }

    /**
     * PENDING 메시지 개수 (DTO 반환)
     */
    fun getPendingCountDto(): Map<String, Long> {
        return mapOf("count" to getPendingCount())
    }

    /**
     * 토픽별 PENDING 개수
     */
    fun getPendingCountByTopic(topic: String): Long {
        return dlqMessageRepository.countByOriginalTopicAndStatus(topic, DLQStatus.PENDING)
    }

    /**
     * 토픽별 PENDING 개수 (DTO 반환)
     */
    fun getPendingCountByTopicDto(topic: String): Map<String, Long> {
        return mapOf("count" to getPendingCountByTopic(topic))
    }

    /**
     * 메시지 재처리 (원본 토픽으로 재전송)
     *
     * @param id DLQ 메시지 ID
     * @param adminId 관리자 ID
     * @return 재처리 성공 여부
     */
    fun reprocessMessage(id: String, adminId: String): Boolean {
        val message = dlqMessageRepository.findById(id)
            ?: throw IllegalArgumentException("DLQ message not found: id=$id")

        if (message.status == DLQStatus.RESOLVED) {
            logger.warn("Cannot reprocess resolved message: id={}", id)
            return false
        }

        try {
            logger.info(
                "Reprocessing DLQ message: id={}, originalTopic={}, adminId={}",
                id, message.originalTopic, adminId
            )

            // 재처리 상태로 변경
            message.markAsReprocessing()
            dlqMessageRepository.save(message)

            // 원본 토픽으로 메시지 재전송
            kafkaTemplate.send(message.originalTopic, message.originalMessage).get()

            logger.info(
                "DLQ message reprocessed successfully: id={}, topic={}",
                id, message.originalTopic
            )

            // 재처리 성공 → RESOLVED로 변경
            message.markAsResolved(adminId, "Reprocessed successfully")
            dlqMessageRepository.save(message)

            return true

        } catch (e: Exception) {
            logger.error(
                "Failed to reprocess DLQ message: id={}, topic={}",
                id, message.originalTopic, e
            )

            // 실패 시 다시 PENDING으로
            message.status = DLQStatus.PENDING
            dlqMessageRepository.save(message)

            throw e
        }
    }

    /**
     * 메시지 재처리 (원본 토픽으로 재전송) - DTO 반환
     *
     * @param id DLQ 메시지 ID
     * @param adminId 관리자 ID
     * @return ReprocessResponse
     */
    fun reprocessMessageDto(id: String, adminId: String): ReprocessResponse {
        return try {
            val success = reprocessMessage(id, adminId)
            ReprocessResponse(
                success = success,
                message = if (success) "Message reprocessed successfully" else "Failed to reprocess message"
            )
        } catch (e: Exception) {
            ReprocessResponse(
                success = false,
                message = e.message ?: "Unknown error"
            )
        }
    }

    /**
     * 메시지를 해결됨으로 표시 (재처리 없이)
     */
    fun markAsResolved(id: String, adminId: String, note: String? = null): DLQMessage {
        val message = dlqMessageRepository.findById(id)
            ?: throw IllegalArgumentException("DLQ message not found: id=$id")

        message.markAsResolved(adminId, note)
        return dlqMessageRepository.save(message)
    }

    /**
     * 메시지를 무시됨으로 표시
     */
    fun markAsIgnored(id: String, adminId: String, reason: String): DLQMessage {
        val message = dlqMessageRepository.findById(id)
            ?: throw IllegalArgumentException("DLQ message not found: id=$id")

        message.markAsIgnored(adminId, reason)
        return dlqMessageRepository.save(message)
    }

    /**
     * 오래된 PENDING 메시지 조회 (3일 이상)
     */
    fun getOldPendingMessages(): List<DLQMessage> {
        val threeDaysAgo = LocalDateTime.now().minusDays(3)
        return dlqMessageRepository.findOldPendingMessages(threeDaysAgo)
    }

    /**
     * 대시보드용 통계
     */
    fun getStatistics(): DLQStatistics {
        val totalCount = dlqMessageRepository.count()
        val pendingCount = dlqMessageRepository.countByStatus(DLQStatus.PENDING)
        val reprocessingCount = dlqMessageRepository.countByStatus(DLQStatus.REPROCESSING)
        val resolvedCount = dlqMessageRepository.countByStatus(DLQStatus.RESOLVED)
        val ignoredCount = dlqMessageRepository.countByStatus(DLQStatus.IGNORED)

        return DLQStatistics(
            totalCount = totalCount,
            pendingCount = pendingCount,
            reprocessingCount = reprocessingCount,
            resolvedCount = resolvedCount,
            ignoredCount = ignoredCount
        )
    }
}

/**
 * DLQ 통계
 */
data class DLQStatistics(
    val totalCount: Long,
    val pendingCount: Long,
    val reprocessingCount: Long,
    val resolvedCount: Long,
    val ignoredCount: Long
)

/**
 * 재처리 응답
 */
data class ReprocessResponse(
    val success: Boolean,
    val message: String
)
