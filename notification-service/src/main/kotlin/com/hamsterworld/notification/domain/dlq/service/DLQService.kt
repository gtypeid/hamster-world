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

@Service
class DLQService(
    private val dlqMessageRepository: DLQMessageRepository,
    private val kafkaTemplate: KafkaTemplate<String, String>
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun searchList(search: DLQSearchRequest): List<DLQMessage> {
        return dlqMessageRepository.findAll(search)
    }

    fun searchPage(search: DLQSearchRequest): Page<DLQMessage> {
        return dlqMessageRepository.findAllPage(search)
    }

    fun getMessageById(id: String): DLQMessage? {
        return dlqMessageRepository.findById(id)
    }

    fun getPendingCount(): Long {
        return dlqMessageRepository.countByStatus(DLQStatus.PENDING)
    }

    fun getPendingCountDto(): Map<String, Long> {
        return mapOf("count" to getPendingCount())
    }

    fun getPendingCountByTopic(topic: String): Long {
        return dlqMessageRepository.countByOriginalTopicAndStatus(topic, DLQStatus.PENDING)
    }

    fun getPendingCountByTopicDto(topic: String): Map<String, Long> {
        return mapOf("count" to getPendingCountByTopic(topic))
    }

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

            message.markAsReprocessing()
            dlqMessageRepository.save(message)

            kafkaTemplate.send(message.originalTopic, message.originalMessage).get()

            logger.info(
                "DLQ message reprocessed successfully: id={}, topic={}",
                id, message.originalTopic
            )

            message.markAsResolved(adminId, "Reprocessed successfully")
            dlqMessageRepository.save(message)

            return true

        } catch (e: Exception) {
            logger.error(
                "Failed to reprocess DLQ message: id={}, topic={}",
                id, message.originalTopic, e
            )

            message.status = DLQStatus.PENDING
            dlqMessageRepository.save(message)

            throw e
        }
    }

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

    fun markAsResolved(id: String, adminId: String, note: String? = null): DLQMessage {
        val message = dlqMessageRepository.findById(id)
            ?: throw IllegalArgumentException("DLQ message not found: id=$id")

        message.markAsResolved(adminId, note)
        return dlqMessageRepository.save(message)
    }

    fun markAsIgnored(id: String, adminId: String, reason: String): DLQMessage {
        val message = dlqMessageRepository.findById(id)
            ?: throw IllegalArgumentException("DLQ message not found: id=$id")

        message.markAsIgnored(adminId, reason)
        return dlqMessageRepository.save(message)
    }

    fun getOldPendingMessages(): List<DLQMessage> {
        val threeDaysAgo = LocalDateTime.now().minusDays(3)
        return dlqMessageRepository.findOldPendingMessages(threeDaysAgo)
    }

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

data class DLQStatistics(
    val totalCount: Long,
    val pendingCount: Long,
    val reprocessingCount: Long,
    val resolvedCount: Long,
    val ignoredCount: Long
)

data class ReprocessResponse(
    val success: Boolean,
    val message: String
)
