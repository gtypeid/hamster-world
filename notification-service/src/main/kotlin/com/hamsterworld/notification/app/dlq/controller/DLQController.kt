package com.hamsterworld.notification.app.dlq.controller

import com.hamsterworld.notification.app.dlq.request.DLQSearchRequest
import com.hamsterworld.notification.domain.dlq.model.DLQMessage
import com.hamsterworld.notification.domain.dlq.service.DLQService
import com.hamsterworld.notification.domain.dlq.service.DLQStatistics
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * DLQ 관리 REST API
 *
 * ## Progression Service 패턴 적용:
 * 1. **SearchRequest 기반 조회**: Request Parameter Binding으로 DLQSearchRequest 자동 생성
 * 2. **비즈니스 로직 없음**: Controller는 순수 위임만 수행
 * 3. **List/Page 분리**: /search/list, /search/page 엔드포인트
 * 4. **Command Request DTO**: 명시적 Request DTO 사용
 *
 * ## 엔드포인트
 *
 * ### 조회
 * - GET /api/dlq/search/list - List 조회 (SearchRequest)
 * - GET /api/dlq/search/page - Page 조회 (SearchRequest)
 * - GET /api/dlq/{id} - 단건 조회
 * - GET /api/dlq/statistics - 통계
 * - GET /api/dlq/pending-count - PENDING 개수
 * - GET /api/dlq/topic/{topic}/pending-count - 토픽별 PENDING 개수
 * - GET /api/dlq/old-pending - 오래된 PENDING 메시지 (3일 이상)
 *
 * ### Command
 * - POST /api/dlq/{id}/reprocess - 재처리
 * - POST /api/dlq/{id}/resolve - 해결 표시
 * - POST /api/dlq/{id}/ignore - 무시 표시
 *
 * ## 검색 예시
 * ```
 * # 기본 조회
 * GET /api/dlq/search/list
 *
 * # 상태별 조회
 * GET /api/dlq/search/list?status=PENDING
 *
 * # 토픽별 조회
 * GET /api/dlq/search/list?originalTopic=ecommerce-events
 *
 * # 날짜 범위
 * GET /api/dlq/search/list?from=2025-01-01&to=2025-12-31
 *
 * # 페이징
 * GET /api/dlq/search/page?page=0&size=20&sort=DESC
 *
 * # 복합 검색
 * GET /api/dlq/search/list?originalTopic=payment-events&status=PENDING&from=2025-02-01
 *
 * # BaseDomainEvent 필드 검색 (외벽)
 * GET /api/dlq/search/list?aggregateId=product-123
 * GET /api/dlq/search/list?eventId=evt-456
 * GET /api/dlq/search/list?traceId=trace-789  # 분산 추적
 * GET /api/dlq/search/list?eventType=ProductCreatedEvent
 * ```
 */
@RestController
@RequestMapping("/api/dlq")
class DLQController(
    private val dlqService: DLQService
) {

    // ===== 조회 (Progression Service 패턴) =====

    /**
     * 검색 조건 기반 조회 (List)
     *
     * Spring이 자동으로 Query Parameter를 DLQSearchRequest로 바인딩
     */
    @GetMapping("/search/list")
    fun searchList(searchRequest: DLQSearchRequest): ResponseEntity<List<DLQMessage>> {
        return ResponseEntity.ok(dlqService.searchList(searchRequest))
    }

    /**
     * 검색 조건 기반 조회 (Page)
     */
    @GetMapping("/search/page")
    fun searchPage(searchRequest: DLQSearchRequest): ResponseEntity<Page<DLQMessage>> {
        return ResponseEntity.ok(dlqService.searchPage(searchRequest))
    }

    /**
     * ID로 단건 조회
     */
    @GetMapping("/{id}")
    fun getMessageById(@PathVariable id: String): ResponseEntity<DLQMessage> {
        val message = dlqService.getMessageById(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(message)
    }

    /**
     * 통계 조회
     */
    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<DLQStatistics> {
        return ResponseEntity.ok(dlqService.getStatistics())
    }

    /**
     * PENDING 개수 조회
     */
    @GetMapping("/pending-count")
    fun getPendingCount(): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(mapOf("count" to dlqService.getPendingCount()))
    }

    /**
     * 토픽별 PENDING 개수
     */
    @GetMapping("/topic/{topic}/pending-count")
    fun getPendingCountByTopic(@PathVariable topic: String): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(mapOf("count" to dlqService.getPendingCountByTopic(topic)))
    }

    /**
     * 오래된 PENDING 메시지 조회 (3일 이상)
     */
    @GetMapping("/old-pending")
    fun getOldPendingMessages(): ResponseEntity<List<DLQMessage>> {
        return ResponseEntity.ok(dlqService.getOldPendingMessages())
    }

    // ===== Command (명시적 Request DTO 사용) =====

    /**
     * 메시지 재처리
     */
    @PostMapping("/{id}/reprocess")
    fun reprocessMessage(
        @PathVariable id: String,
        @RequestBody request: ReprocessRequest
    ): ResponseEntity<ReprocessResponse> {
        return try {
            val success = dlqService.reprocessMessage(id, request.adminId)
            ResponseEntity.ok(
                ReprocessResponse(
                    success = success,
                    message = if (success) "Message reprocessed successfully" else "Failed to reprocess message"
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().body(
                ReprocessResponse(
                    success = false,
                    message = e.message ?: "Unknown error"
                )
            )
        }
    }

    /**
     * 메시지를 해결됨으로 표시
     */
    @PostMapping("/{id}/resolve")
    fun resolveMessage(
        @PathVariable id: String,
        @RequestBody request: ResolveRequest
    ): ResponseEntity<DLQMessage> {
        val updated = dlqService.markAsResolved(id, request.adminId, request.note)
        return ResponseEntity.ok(updated)
    }

    /**
     * 메시지를 무시됨으로 표시
     */
    @PostMapping("/{id}/ignore")
    fun ignoreMessage(
        @PathVariable id: String,
        @RequestBody request: IgnoreRequest
    ): ResponseEntity<DLQMessage> {
        val updated = dlqService.markAsIgnored(id, request.adminId, request.reason)
        return ResponseEntity.ok(updated)
    }
}

/**
 * Command Request DTOs
 *
 * Progression Service 패턴: POST 요청은 명시적 Request DTO 사용
 */
data class ReprocessRequest(
    val adminId: String
)

data class ResolveRequest(
    val adminId: String,
    val note: String? = null
)

data class IgnoreRequest(
    val adminId: String,
    val reason: String
)

data class ReprocessResponse(
    val success: Boolean,
    val message: String
)
