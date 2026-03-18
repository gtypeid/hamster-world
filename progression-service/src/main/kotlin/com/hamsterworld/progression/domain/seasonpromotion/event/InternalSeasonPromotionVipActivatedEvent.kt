package com.hamsterworld.progression.domain.seasonpromotion.event

/**
 * Season Promotion VIP 활성화 Internal 이벤트
 *
 * Progression Service 내부 → @EventListener (동기)
 * - 로깅/감사 목적
 * - Kafka 전송 안됨
 */
data class InternalSeasonPromotionVipActivatedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val promotionId: String
)
