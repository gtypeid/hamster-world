package com.hamsterworld.progression.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

/**
 * Progression Service 도메인 이벤트 Base
 *
 * 상속받는 모든 이벤트는 자동으로 이 서비스가 소유한 Kafka 토픽으로 발행됩니다.
 *
 * 용도:
 * - Archive 클레임 이벤트 (ArchiveClaimedEvent) → Payment Service
 * - Quota 클레임 이벤트 (QuotaClaimedEvent) → Payment Service
 */
abstract class ProgressionDomainEvent(
    aggregateId: String,
    aggregateType: String,
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    spanId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    aggregateType = aggregateType,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt,
    topic = KafkaTopics.PROGRESSION_EVENTS
)
