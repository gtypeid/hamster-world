package com.hamsterworld.progression.domain.seasonpromotion.event

import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.progression.web.event.ProgressionDomainEvent
import java.time.LocalDateTime

/**
 * Season Promotion 보상 클레임 이벤트
 *
 * Progression Service → Payment Service (Kafka)
 * - Payment Service가 소비하여 포인트/쿠폰 지급
 * - 기본 보상과 VIP 보너스 각각 별도 이벤트로 발행
 */
data class SeasonPromotionRewardClaimedEvent(
    val userPublicId: String,
    val promotionId: String,
    val step: Int,
    val rewardType: String,    // "POINT", "COUPON", "BADGE"
    val rewardAmount: Int,
    val isVipBonus: Boolean,   // true: VIP 보너스, false: 기본 보상
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : ProgressionDomainEvent(
    aggregateId = userPublicId,  // User가 aggregate
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
