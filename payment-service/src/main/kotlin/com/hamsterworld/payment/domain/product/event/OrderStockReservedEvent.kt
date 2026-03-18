package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

data class OrderStockReservedEvent(
    val orderPublicId: String,
    val userPublicId: String,
    val userKeycloakId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val couponDiscount: BigDecimal,
    val pointsUsed: BigDecimal,
    val cashAmount: BigDecimal,
    val items: List<OrderItemDto>,
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

data class OrderItemDto(
    val productId: String,
    val merchantPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
