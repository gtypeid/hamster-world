package com.hamsterworld.ecommerce.domain.product.event

import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import java.time.LocalDateTime

/**
 * 재고 조정 요청 이벤트
 *
 * E-commerce Service (Admin) → Payment Service
 *
 * Payment Service에서 수신하여:
 * 1. ProductRecord INSERT (재고 변경)
 * 2. Product.stock 재집계
 * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
 */
data class StockAdjustmentRequestedEvent(
    val productPublicId: String,  // Product의 Public ID (Snowflake Base62)
    val stock: Int,              // +50 (입고), -10 (수정)
    val reason: String,           // "추가 입고", "재고 조정" 등
    // DomainEvent 메타데이터
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = productPublicId,  // Already a String (Public ID)
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)
