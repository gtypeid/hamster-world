package com.hamsterworld.progression.domain.quota.event

import com.hamsterworld.progression.web.event.ProgressionDomainEvent
import java.time.LocalDateTime

/**
 * Quota 보상 클레임 이벤트
 *
 * Progression Service → Payment Service (Kafka)
 * - Payment Service가 소비하여 포인트/쿠폰 지급
 */
data class QuotaClaimedEvent(
    val userPublicId: String,
    val quotaKey: String,
    val rewardType: String,    // "POINT", "COUPON"
    val rewardAmount: Int,
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : ProgressionDomainEvent(
    aggregateId = userPublicId,  // User가 aggregate
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt
)
