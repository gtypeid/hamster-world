package com.hamsterworld.ecommerce.domain.order.event
import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.ecommerce.web.event.EcommerceDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime
data class OrderCreatedEvent(
    val orderPublicId: String,
    val userPublicId: String,
    val userKeycloakId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : EcommerceDomainEvent(
    aggregateId = orderPublicId,
    aggregateType = "Order",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
data class OrderItemDto(
    val productPublicId: String,
    val merchantPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
