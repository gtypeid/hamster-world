package com.hamsterworld.payment.domain.payment.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime
import java.util.UUID

data class PaymentConfirmedEvent(
    val paymentPublicId: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val status: PaymentStatus,
    val gatewayPaymentPublicId: String,
    override val eventId: String = UUID.randomUUID().toString(),
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
