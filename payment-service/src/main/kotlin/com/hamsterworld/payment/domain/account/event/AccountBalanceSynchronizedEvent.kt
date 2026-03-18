package com.hamsterworld.payment.domain.account.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.math.BigDecimal
import java.time.LocalDateTime

data class AccountBalanceSynchronizedEvent(
    val accountPublicId: String,
    val userPublicId: String,
    val accountType: String,
    val balance: BigDecimal,
    val reason: String,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = userPublicId,
    aggregateType = "Account",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
