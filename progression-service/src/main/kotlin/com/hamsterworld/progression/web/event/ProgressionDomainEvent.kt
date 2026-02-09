package com.hamsterworld.progression.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
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
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    spanId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt,
    topic = ProgressionDomainEventTopicProvider.topic
)

/**
 * Spring Property를 사용하여 토픽 이름을 제공하는 컴포넌트
 *
 * kafka-topology.yml에 정의된 토픽을 자동으로 주입받아 사용합니다.
 */
@Component
class ProgressionDomainEventTopicProvider {
    companion object {
        lateinit var topic: String
            private set
    }

    @Value("\${kafka.service.progression-service.topic}")
    fun setTopic(topicName: String) {
        topic = topicName
    }
}
