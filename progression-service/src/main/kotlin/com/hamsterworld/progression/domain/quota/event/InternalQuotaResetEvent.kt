package com.hamsterworld.progression.domain.quota.event

/**
 * Quota 리셋 Internal 이벤트
 *
 * Progression Service 내부 → @EventListener (동기)
 * - 로깅/감사 목적
 * - Kafka 전송 안됨
 */
data class InternalQuotaResetEvent(
    val aggregateId: String,
    val userPublicId: String,
    val quotaKey: String,
    val cycleType: String     // "DAILY", "WEEKLY", "MONTHLY"
)
