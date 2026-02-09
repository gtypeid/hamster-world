package com.hamsterworld.common.web.kafka

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.domain.outboxevent.model.OutboxEvent
import com.hamsterworld.common.domain.outboxevent.repository.OutboxEventRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID

/**
 * Outbox Event Recorder
 *
 * Transactional Outbox Pattern을 구현한 도메인 이벤트 레코더
 *
 * ## 작동 방식
 * ```
 * 1. Entity가 registerEvent()로 이벤트 등록
 * 2. repository.save() 호출
 * 3. Spring Data가 @DomainEvents 메서드 호출 → ApplicationEvent 발행
 * 4. 이 클래스가 @TransactionalEventListener(BEFORE_COMMIT)로 수신
 * 5. OutboxEvent를 DB에 저장 (같은 트랜잭션)
 * 6. Transaction COMMIT (Entity + OutboxEvent 원자적 저장)
 * ---
 * 7. OutboxEventProcessor가 주기적으로 PENDING 이벤트 조회
 * 8. Kafka로 발행 시도
 * 9. 성공 시 status → PUBLISHED
 * ```
 *
 * ## 기존 DomainEventPublisher와의 차이
 *
 * ### DomainEventPublisher (LEGACY)
 * - AFTER_COMMIT: DB 커밋 후 Kafka 발행
 * - Kafka 실패 시 이벤트 유실 💥
 * - 재시도 없음
 *
 * ### OutboxEventRecorder (NEW)
 * - BEFORE_COMMIT: DB 커밋 전 OutboxEvent 저장
 * - Kafka 실패 시 OutboxEvent에 남아있음 ✅
 * - OutboxEventProcessor가 자동 재시도
 * - 트랜잭션 보장 (Entity + OutboxEvent 원자적)
 *
 * ## 트랜잭션 보장
 * ```
 * [성공 케이스]
 * 1. Order 저장
 * 2. OutboxEvent 저장 (BEFORE_COMMIT)
 * 3. DB COMMIT ✅ (둘 다 성공)
 *
 * [실패 케이스]
 * 1. Order 저장
 * 2. OutboxEvent 저장 실패 ❌
 * 3. DB ROLLBACK (둘 다 롤백)
 *
 * → 데이터 일관성 100% 보장
 * ```
 */
@Component
class OutboxEventRecorder(
    private val outboxEventRepository: OutboxEventRepository,
    private val objectMapper: ObjectMapper
) {
    companion object {
        private val log = LoggerFactory.getLogger(OutboxEventRecorder::class.java)
    }

    /**
     * 도메인 이벤트를 OutboxEvent로 저장
     *
     * BEFORE_COMMIT 전략:
     * - 트랜잭션 커밋 전에 OutboxEvent 저장
     * - Entity와 OutboxEvent가 같은 트랜잭션에서 원자적으로 저장됨
     * - OutboxEvent 저장 실패 시 전체 트랜잭션 롤백
     *
     * @param event Domain Event (BaseDomainEvent 상속)
     */
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    fun recordDomainEvent(event: DomainEvent) {
        try {
            val eventType = event::class.simpleName ?: "UnknownEvent"

            // BaseDomainEvent를 상속한 경우만 처리 (topic 필드 존재)
            if (event !is BaseDomainEvent) {
                log.debug("Skipping non-BaseDomainEvent: {}", eventType)
                return
            }

            val topic = event.topic
            val eventId = event.eventId
            val aggregateId = event.aggregateId

            // 멱등성 보장: DB UNIQUE 제약조건에 위임
            // - event_id 컬럼에 UNIQUE 제약조건 있음
            // - 중복 INSERT 시도 시 DB에서 예외 발생 → 전체 트랜잭션 롤백
            // - Order와 OutboxEvent의 원자성 보장

            // 이벤트 직렬화 (Kafka에 발행할 JSON)
            val payload = serializeEvent(event, eventType)

            // OutboxEvent 생성 (trace context 포함)
            val outboxEvent = OutboxEvent(
                eventId = eventId,
                eventType = eventType,
                aggregateId = aggregateId,
                topic = topic,
                payload = payload,
                traceId = event.traceId,
                spanId = event.spanId
            )

            // OutboxEvent 저장 (같은 트랜잭션)
            outboxEventRepository.save(outboxEvent)

            log.info(
                "Recorded OutboxEvent - Type: {}, Topic: {}, AggregateId: {}, EventId: {}",
                eventType, topic, aggregateId, eventId
            )

        } catch (ex: Exception) {
            log.error("Failed to record OutboxEvent: {}", event::class.simpleName, ex)
            // 예외를 다시 던져서 트랜잭션 롤백 유도
            throw ex
        }
    }

    /**
     * 이벤트 직렬화 (DomainEventPublisher와 동일한 형식)
     *
     * payload에는 비즈니스 데이터만 포함
     * metadata는 이벤트의 인프라 필드에서 추출
     *
     * 메시지 구조:
     * ```json
     * {
     *   "eventType": "OrderCreatedEvent",
     *   "aggregateId": "order-123",
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
        val spanId = event.spanId  // spanId 추가
        val occurredAt = event.occurredAt

        // payload는 aggregateId, topic, eventId, traceId, spanId, occurredAt을 제외한 순수 비즈니스 데이터
        @Suppress("UNCHECKED_CAST")
        val eventMap = objectMapper.convertValue(event, Map::class.java) as Map<String, Any?>
        val payloadMap = eventMap.filterKeys {
            it !in setOf("aggregateId", "topic", "eventId", "traceId", "spanId", "occurredAt")
        }

        return objectMapper.writeValueAsString(
            mapOf(
                "eventType" to eventType,
                "aggregateId" to event.aggregateId,
                "payload" to payloadMap,
                "metadata" to mapOf(
                    "eventId" to eventId,
                    "traceId" to traceId,
                    "spanId" to spanId,  // spanId 추가
                    "occurredAt" to occurredAt
                )
            )
        )
    }
}
