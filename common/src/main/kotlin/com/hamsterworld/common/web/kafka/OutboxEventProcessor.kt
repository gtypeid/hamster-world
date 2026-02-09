package com.hamsterworld.common.web.kafka

import com.hamsterworld.common.domain.outboxevent.model.OutboxEvent
import com.hamsterworld.common.domain.outboxevent.model.OutboxEventStatus
import com.hamsterworld.common.domain.outboxevent.repository.OutboxEventRepository
import com.hamsterworld.common.tracing.TraceContextHolder
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Outbox Event Processor
 *
 * Transactional Outbox Pattern의 비동기 발행 담당
 *
 * ## 작동 방식
 * ```
 * [트랜잭션 내부 - 이미 완료됨]
 * 1. Order 생성
 * 2. OutboxEventRecorder가 OutboxEvent 저장 (BEFORE_COMMIT)
 * 3. DB COMMIT ✅ (Order + OutboxEvent 원자적 저장)
 *
 * [이 클래스가 담당 - 비동기 처리]
 * 4. 주기적으로 PENDING 이벤트 조회
 * 5. Kafka로 발행 시도
 * 6. 성공 시 status → PUBLISHED
 * 7. 실패 시 retryCount 증가, 최대 재시도 초과 시 status → FAILED
 * ```
 *
 * ## 활성화 방법
 * application.yml에 다음 설정 추가:
 * ```yaml
 * outbox:
 *   processor:
 *     enabled: true  # false면 스케줄러 비활성화
 * ```
 *
 * ## 서비스별 전략
 * - **이벤트를 발행하는 서비스**: enabled: true (ecommerce-service, payment-service 등)
 * - **이벤트를 소비만 하는 서비스**: enabled: false (또는 설정 생략)
 * - 모든 서비스가 OutboxEvent를 저장하지만, Processor는 필요한 곳에서만 실행
 *
 * ## 재시도 전략
 * - 기본 최대 재시도: 3회
 * - 재시도 초과 시 status → FAILED
 * - FAILED 이벤트는 별도 모니터링/알람 필요
 *
 * ## 스케줄링
 * - 기본: 1초마다 실행 (fixedDelay = 1000)
 * - PENDING 이벤트를 created_at 오름차순으로 조회 (오래된 것부터 처리)
 * - 배치 크기: 100개 (한 번에 너무 많이 처리하지 않음)
 */
@Component
@ConditionalOnProperty(
    prefix = "outbox.processor",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = false  // 설정 없으면 비활성화
)
class OutboxEventProcessor(
    private val outboxEventRepository: OutboxEventRepository,
    private val kafkaTemplate: KafkaTemplate<String, String>
) {
    companion object {
        private val log = LoggerFactory.getLogger(OutboxEventProcessor::class.java)
        private const val MAX_RETRY_COUNT = 3
        private const val BATCH_SIZE = 100
    }

    /**
     * 주기적으로 PENDING 이벤트를 조회하여 Kafka로 발행
     *
     * fixedDelay: 이전 실행 완료 후 1초 대기 (overlapping 방지)
     * initialDelay: 서버 시작 후 1초 대기 (초기화 시간 확보)
     *
     * CAS(Compare-And-Swap) 방식:
     * - PENDING 상태의 이벤트를 조회
     * - 동기 발행 (get()으로 대기)
     * - 성공/실패에 따라 상태 업데이트
     * - fixedDelay로 중복 실행 방지 (이전 실행 완료 후 다음 실행)
     */
    @Scheduled(fixedDelay = 1000, initialDelay = 1000)
    @Transactional
    fun relay() {
        try {
            // PENDING 상태의 이벤트 배치 조회
            val claimed = outboxEventRepository
                .findByStatusOrderByCreatedAtAsc(OutboxEventStatus.PENDING)
                .take(BATCH_SIZE)  // 한 번에 최대 100개

            if (claimed.isEmpty()) {
                return
            }

            log.info("Processing {} pending outbox events", claimed.size)

            // 각 이벤트를 동기 방식으로 처리
            claimed.forEach { event ->
                try {
                    // ★ CRITICAL: 원본 trace context 복원
                    //    OutboxEvent에 저장된 traceId + spanId로 OpenTelemetry context 복원
                    //    이렇게 해야 OTel 자동 계측이 Kafka 헤더에 올바른 trace ID를 주입함
                    if (event.traceId != null && event.spanId != null) {
                        TraceContextHolder.setTraceContext(event.traceId, event.spanId)
                        log.debug(
                            "Restored trace context before Kafka send: traceId={}, spanId={}",
                            event.traceId, event.spanId
                        )
                    } else {
                        log.warn(
                            "Missing trace context in OutboxEvent: eventId={}, traceId={}, spanId={}",
                            event.eventId, event.traceId, event.spanId
                        )
                    }

                    // Kafka로 동기 발행 (get()으로 완료 대기)
                    // OTel 자동 계측이 현재 trace context를 Kafka 헤더에 주입함
                    kafkaTemplate
                        .send(event.topic, event.aggregateId, event.payload)
                        .get()  // 동기 대기

                    // 발행 성공 처리
                    markSent(event)

                } catch (ex: Exception) {
                    // 발행 실패 처리
                    markFailed(event, ex.message ?: "Unknown error")
                }
            }

        } catch (ex: Exception) {
            log.error("Unexpected error during outbox event processing", ex)
        }
    }

    /**
     * 발행 성공 처리
     */
    private fun markSent(event: OutboxEvent) {
        event.markAsPublished()
        outboxEventRepository.save(event)

        log.info(
            "Successfully published OutboxEvent - EventId: {}, Type: {}, Topic: {}",
            event.eventId, event.eventType, event.topic
        )
    }

    /**
     * 발행 실패 처리
     */
    private fun markFailed(event: OutboxEvent, errorMessage: String) {
        event.markAsFailedWithRetry(errorMessage, MAX_RETRY_COUNT)
        outboxEventRepository.save(event)

        if (event.status == OutboxEventStatus.FAILED) {
            log.error(
                "OutboxEvent failed permanently after {} retries - EventId: {}, Type: {}, Error: {}",
                MAX_RETRY_COUNT, event.eventId, event.eventType, errorMessage
            )
            // TODO: 알람 발송 (Slack, PagerDuty 등)
        } else {
            log.warn(
                "OutboxEvent publish failed, will retry - EventId: {}, Type: {}, RetryCount: {}/{}, Error: {}",
                event.eventId, event.eventType, event.retryCount, MAX_RETRY_COUNT, errorMessage
            )
        }
    }

    /**
     * 오래된 PUBLISHED 이벤트 정리 (선택적)
     *
     * 매일 새벽 2시에 실행
     * 30일 이전에 발행 완료된 이벤트 삭제
     */
    @Scheduled(cron = "0 0 2 * * *")  // 매일 02:00:00
    @Transactional
    fun cleanupOldPublishedEvents() {
        try {
            val thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30)
            val oldEvents = outboxEventRepository.findByStatusAndPublishedAtBefore(
                OutboxEventStatus.PUBLISHED,
                thirtyDaysAgo
            )

            if (oldEvents.isEmpty()) {
                log.debug("No old published events to cleanup")
                return
            }

            outboxEventRepository.deleteAll(oldEvents)
            log.info("Cleaned up {} old published events (older than 30 days)", oldEvents.size)

        } catch (ex: Exception) {
            log.error("Error during cleanup of old published events", ex)
        }
    }
}
