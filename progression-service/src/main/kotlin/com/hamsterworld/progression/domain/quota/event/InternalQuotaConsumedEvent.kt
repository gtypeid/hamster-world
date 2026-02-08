package com.hamsterworld.progression.domain.quota.event

/**
 * Quota 소비 Internal 이벤트
 *
 * Progression Service 내부 → @EventListener (동기)
 * - 로깅/감사 목적
 * - Kafka 전송 안됨
 */
data class InternalQuotaConsumedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val quotaKey: String,
    val amount: Int,
    val consumed: Int,
    val maxLimit: Int,
    val isCompleted: Boolean
)
