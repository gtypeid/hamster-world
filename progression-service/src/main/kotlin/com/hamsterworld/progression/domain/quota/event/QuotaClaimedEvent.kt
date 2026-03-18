package com.hamsterworld.progression.domain.quota.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.progression.web.event.ProgressionDomainEvent
import java.time.LocalDateTime

data class QuotaClaimedEvent(
    val userPublicId: String,
    val quotaKey: String,
    val rewardType: String,
    val rewardAmount: Int,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : ProgressionDomainEvent(
    aggregateId = userPublicId,
    aggregateType = "User",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
