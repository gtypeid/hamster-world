package com.hamsterworld.progression.domain.seasonpromotion.event

/**
 * Season Promotion 스텝 진행 Internal 이벤트
 *
 * Progression Service 내부 → @EventListener (동기)
 * - 로깅/감사 목적
 * - Kafka 전송 안됨
 */
data class InternalSeasonPromotionStepAdvancedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val promotionId: String,
    val previousStep: Int,
    val currentStep: Int,
    val advanced: Int
)
