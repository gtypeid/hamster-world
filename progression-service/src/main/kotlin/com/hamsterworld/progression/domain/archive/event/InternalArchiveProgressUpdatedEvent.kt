package com.hamsterworld.progression.domain.archive.event

/**
 * Archive 진행도 업데이트 Internal 이벤트
 *
 * Progression Service 내부 → @EventListener (동기)
 * - 로깅/감사 목적
 * - Kafka 전송 안됨
 */
data class InternalArchiveProgressUpdatedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val archiveId: String,
    val progress: Int,
    val requirement: Int,
    val isCompleted: Boolean
)
