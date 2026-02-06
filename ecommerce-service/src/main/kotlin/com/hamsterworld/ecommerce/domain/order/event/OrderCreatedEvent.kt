package com.hamsterworld.ecommerce.domain.order.event

import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 주문 생성 이벤트
 *
 * Ecommerce Service → Payment Service, Cash-Gateway Service (병렬)
 *
 * ## Payment Service에서 수신하여:
 * - 재고 차감 (RESERVED 상태로)
 * - ProductRecord 생성 (orderId 기록)
 *
 * ## Cash-Gateway Service에서 수신하여:
 * - PaymentAttempt 생성
 * - PG 결제 요청
 */
data class OrderCreatedEvent(
    val orderPublicId: String,        // Order의 Public ID (Snowflake Base62)
    val userPublicId: String,         // User의 Public ID (Snowflake Base62)
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>,
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = AuditContextHolder.getContext()?.traceId,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = orderPublicId,  // Already a String (Public ID)
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)

/**
 * 주문 항목 DTO (OrderCreatedEvent 내부용)
 */
data class OrderItemDto(
    val productPublicId: String,  // Product의 Public ID (Snowflake Base62)
    val quantity: Int,
    val price: BigDecimal
)
