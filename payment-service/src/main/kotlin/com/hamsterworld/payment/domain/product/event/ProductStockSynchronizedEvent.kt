package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.time.LocalDateTime

data class ProductStockSynchronizedEvent(
    val productPublicId: String,
    val ecommerceProductId: String,
    val stock: Int,
    val isSoldOut: Boolean,
    val reason: String,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = ecommerceProductId,
    aggregateType = "Product",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
