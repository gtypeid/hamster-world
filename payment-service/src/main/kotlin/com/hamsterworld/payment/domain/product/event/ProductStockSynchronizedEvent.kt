package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import java.time.LocalDateTime

/**
 * 재고 동기화 이벤트 (Kafka 전송용 이벤트)
 *
 * Payment Service → E-commerce Service (Kafka)
 *
 * ## 목적
 * - Payment Service의 재고 변경을 E-commerce Service에 전파
 * - E-commerce Service의 Product.stock, isSoldOut 동기화
 *
 * ## 발행 시점
 * - ProductEventHandler에서 ProductStockChangedEvent 처리 후 발행
 * - OutboxEventProcessor가 Kafka로 전송
 *
 * ## 처리 흐름
 * ```
 * 1. Product.updateStockByDelta() → ProductStockChangedEvent (내부)
 * 2. ProductEventHandler.handle() → ProductRecord 생성
 * 3. ProductEventHandler.handle() → ProductStockSynchronizedEvent 발행 (Kafka)
 * 4. OutboxEventProcessor → Kafka 전송
 * 5. E-commerce PaymentEventConsumer → Product.syncStockFromPayment()
 * ```
 */
data class ProductStockSynchronizedEvent(
    val productPublicId: String,      // Payment Service Product의 Public ID (Snowflake Base62)
    val ecommerceProductId: String,   // E-commerce Service Product의 Public ID (Snowflake Base62)
    val stock: Int,                   // 현재 재고 수량 (절대값)
    val isSoldOut: Boolean,           // 품절 여부
    val reason: String,               // 변경 사유
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = AuditContextHolder.getContext()?.traceId,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = ecommerceProductId,  // E-commerce Product의 Public ID
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)
