package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import java.time.LocalDateTime

/**
 * 주문 재고 검증 실패 이벤트
 *
 * Payment Service → E-commerce Service (Kafka)
 *
 * ## 발생 시점
 * - OrderCreatedEvent 수신 후 재고 검증 실패 시
 *
 * ## E-commerce Service에서 수신하여:
 * - Order 상태를 FAILED로 변경
 * - 사용자에게 재고 부족 안내
 *
 * ## Cash-Gateway Service:
 * - 이 이벤트는 무시 (PG 요청 불필요)
 */
data class OrderStockValidationFailedEvent(
    val orderPublicId: String,            // E-commerce Service의 Order Public ID (Snowflake Base62)
    val orderNumber: String,              // 주문 번호
    val failureReason: String,            // 실패 사유 (재고 부족 상세)
    val insufficientProducts: List<InsufficientProductDto>,  // 재고 부족 상품 목록
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = AuditContextHolder.getContext()?.traceId,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = orderPublicId,  // Already a String (Public ID)
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)

/**
 * 재고 부족 상품 정보
 */
data class InsufficientProductDto(
    val productId: String,      // E-commerce Product Public ID (Snowflake Base62)
    val requestedQuantity: Int, // 요청 수량
    val availableStock: Int     // 가용 재고
)
