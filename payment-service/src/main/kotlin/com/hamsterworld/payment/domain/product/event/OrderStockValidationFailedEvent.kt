package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.time.LocalDateTime

data class OrderStockValidationFailedEvent(
    val orderPublicId: String,
    val orderNumber: String,
    val failureReason: String,
    val insufficientProducts: List<InsufficientProductDto>,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = orderPublicId,
    aggregateType = "Order",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)

data class InsufficientProductDto(
    val productId: String,
    val requestedQuantity: Int,
    val availableStock: Int
)
