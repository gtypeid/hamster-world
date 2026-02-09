package com.hamsterworld.notification.app.dlq.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import java.time.LocalDate

/**
 * DLQ 메시지 검색 Request
 *
 * ## 사용 예시
 *
 * ### 1. 기본 조회
 * ```
 * GET /api/dlq/search/list
 * ```
 *
 * ### 2. 상태별 조회
 * ```
 * GET /api/dlq/search/list?status=PENDING
 * ```
 *
 * ### 3. 토픽별 조회
 * ```
 * GET /api/dlq/search/list?originalTopic=ecommerce-events
 * ```
 *
 * ### 4. 날짜 범위 조회
 * ```
 * GET /api/dlq/search/list?from=2025-01-01&to=2025-12-31
 * ```
 *
 * ### 5. 페이징 조회
 * ```
 * GET /api/dlq/search/page?page=0&size=20&sort=DESC
 * ```
 *
 * ### 6. 복합 검색
 * ```
 * GET /api/dlq/search/list?originalTopic=payment-events&status=PENDING&from=2025-02-01
 * ```
 */
data class DLQSearchRequest(
    // ===== 공통 검색 조건 (AppPagedSearchQuery 상속) =====
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    // ===== DLQ 특화 검색 조건 =====

    /**
     * 원본 토픽 이름
     * 예: "ecommerce-events", "payment-events"
     */
    val originalTopic: String? = null,

    /**
     * Consumer Group ID
     * 예: "ecommerce-service", "payment-service"
     */
    val consumerGroup: String? = null,

    /**
     * 처리 상태
     * PENDING, REPROCESSING, RESOLVED, IGNORED
     */
    val status: DLQStatus? = null,

    /**
     * 예외 클래스명 (부분 검색)
     * 예: "DataIntegrityViolationException"
     */
    val exceptionClass: String? = null,

    // ===== BaseDomainEvent 필드 검색 (외벽) =====

    /**
     * Aggregate ID (도메인 식별자)
     * 예: "product-123", "order-456"
     */
    val aggregateId: String? = null,

    /**
     * Event ID (이벤트 고유 ID)
     */
    val eventId: String? = null,

    /**
     * Trace ID (분산 추적 ID)
     */
    val traceId: String? = null,

    /**
     * Event Type (이벤트 타입명)
     * 예: "ProductCreatedEvent", "OrderPlacedEvent"
     */
    val eventType: String? = null

) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
