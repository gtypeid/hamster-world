package com.hamsterworld.ecommerce.domain.product.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 상품 생성 이벤트
 *
 * E-commerce Service → Payment Service
 *
 * Payment Service에서 수신하여:
 * 1. Product 생성 (최소한의 정보만)
 * 2. ProductRecord INSERT (초기 재고)
 * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
 */
data class ProductCreatedEvent(
    val productPublicId: String,    // Product의 Public ID (Snowflake Base62)
    val sku: String,
    val name: String,               // 로깅용 최소 메타데이터
    val price: BigDecimal,
    val initialStock: Int,
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = productPublicId,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
