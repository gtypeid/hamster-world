package com.hamsterworld.payment.domain.payment.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.web.event.PaymentDomainEvent
import java.math.BigDecimal
import java.time.LocalDateTime

data class PaymentCancelConfirmedEvent(
    val paymentPublicId: String,
    val orderPublicId: String,
    val amount: BigDecimal,
    val originPaymentPublicId: String,
    val status: PaymentStatus,
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
