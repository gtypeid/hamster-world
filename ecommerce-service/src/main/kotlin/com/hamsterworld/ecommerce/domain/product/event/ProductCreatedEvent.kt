package com.hamsterworld.ecommerce.domain.product.event
import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime
data class ProductCreatedEvent(
    val productPublicId: String,
    val sku: String,
    val name: String,
    val price: BigDecimal,
    val initialStock: Int,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = productPublicId,
    aggregateType = "Product",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
