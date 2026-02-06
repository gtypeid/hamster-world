package com.hamsterworld.common.web.kafka

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID

/**
 * ⚠️ [LEGACY] - 이 클래스는 비활성화되었습니다. OutboxEventRecorder를 사용하세요.
 *
 * 공통 Kafka Domain Event Publisher
 *
 * **작동 방식:**
 * 1. Entity가 registerEvent()로 이벤트 등록
 * 2. repository.save() 호출
 * 3. Spring Data가 @DomainEvents 메서드 호출 → ApplicationEvent 발행
 * 4. 이 클래스가 @TransactionalEventListener로 수신
 * 5. Kafka로 전송
 * 6. Transaction COMMIT
 *
 * **현재 구조의 특징:**
 * - AFTER_COMMIT: DB 저장은 항상 성공 (진실의 원천 보존)
 * - Kafka 발행 실패 시 메시지 유실 가능 (재시도 로직 없음)
 * - Consumer의 멱등성으로 중복 처리 방지
 *
 * **향후 개선 방향:**
 * - Outbox Pattern 도입으로 안정성 강화 예정
 */

// @Component  // ← LEGACY: OutboxEventRecorder 사용으로 비활성화
class KafkaDomainEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper
) {
    companion object {
        private val log = LoggerFactory.getLogger(KafkaDomainEventPublisher::class.java)
    }

    /**
     * Spring ApplicationEvent를 받아서 Kafka로 발행
     * 트랜잭션 커밋 후 실행 (DB 저장 100% 보장)
     *
     * AFTER_COMMIT 전략:
     * - DB 저장은 항상 성공 (진실의 원천 보존)
     * - Kafka 발행 실패 시 재시도로 해결
     * - Eventual Consistency (언젠가는 전달됨)
     *
     * Note: 이벤트의 topic 필드를 사용하여 Kafka 토픽 결정
     *       - BaseDomainEvent를 직접 상속한 경우: topic 파라미터 필수
     *       - 서비스별 Base(EcommerceDomainEvent, PaymentDomainEvent 등) 상속: 자동 설정
     */
    // @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)  // ← LEGACY: 비활성화
    fun handleDomainEvent(event: DomainEvent) {
        try {
            val eventType = event::class.simpleName ?: "UnknownEvent"

            // BaseDomainEvent를 상속한 경우만 처리 (topic 필드 존재)
            if (event !is BaseDomainEvent) {
                log.debug("Skipping non-BaseDomainEvent: {}", eventType)
                return
            }

            val topic = event.topic

            val eventJson = serializeEvent(event, eventType)

            log.info("Publishing domain event to Kafka - Type: {}, Topic: {}, AggregateId: {}",
                eventType, topic, event.aggregateId)

            // 논블로킹 발행 (Kafka HA 전제)
            kafkaTemplate.send(topic, event.aggregateId, eventJson)
                .whenComplete { result, ex ->
                    if (ex != null) {
                        log.error("Failed to publish domain event: {}, will retry", eventType, ex)
                        // TODO: 재시도 큐에 넣기 or 알람
                    } else {
                        log.info("Successfully published domain event: {}", eventType)
                    }
                }

        } catch (ex: Exception) {
            log.error("Unexpected error handling domain event: {}", event::class.simpleName, ex)
            // DB는 이미 커밋됨, 재시도 필요
        }
    }

    /**
     * 이벤트 직렬화
     *
     * payload에는 비즈니스 데이터만 포함
     * metadata는 이벤트의 인프라 필드에서 추출:
     * - eventId: event.eventId (이벤트 생성 시 자동 생성된 값)
     * - traceId: event.traceId가 있으면 사용, 없으면 생성
     * - occurredAt: event.occurredAt (이벤트 생성 시 자동 생성된 값)
     *
     * 메시지 구조:
     * ```json
     * {
     *   "eventType": "ProductCreatedEvent",
     *   "aggregateId": "product-123",
     *   "payload": { ...business data only... },
     *   "metadata": {
     *     "eventId": "...",
     *     "traceId": "...",
     *     "occurredAt": "..."
     *   }
     * }
     * ```
     */
    private fun serializeEvent(event: DomainEvent, eventType: String): String {
        // 메타데이터는 이벤트 필드에서 추출
        val eventId = event.eventId
        val traceId = event.traceId ?: UUID.randomUUID().toString()
        val occurredAt = event.occurredAt

        // payload는 aggregateId, topic, eventId, traceId, occurredAt을 제외한 순수 비즈니스 데이터
        @Suppress("UNCHECKED_CAST")
        val eventMap = objectMapper.convertValue(event, Map::class.java) as Map<String, Any?>
        val payloadMap = eventMap.filterKeys {
            it !in setOf("aggregateId", "topic", "eventId", "traceId", "occurredAt")
        }

        return objectMapper.writeValueAsString(mapOf(
            "eventType" to eventType,
            "aggregateId" to event.aggregateId,
            "payload" to payloadMap,
            "metadata" to mapOf(
                "eventId" to eventId,
                "traceId" to traceId,
                "occurredAt" to occurredAt
            )
        ))
    }

}
