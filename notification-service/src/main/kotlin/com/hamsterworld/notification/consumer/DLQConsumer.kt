package com.hamsterworld.notification.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import com.hamsterworld.notification.domain.dlq.model.DLQMessage
import com.hamsterworld.notification.domain.dlq.repository.DLQMessageRepository
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.kafka.support.KafkaHeaders
import org.springframework.messaging.handler.annotation.Header
import org.springframework.stereotype.Component
import java.time.LocalDateTime

/**
 * DLQ Consumer
 *
 * 모든 서비스의 DLT (Dead Letter Topic) 메시지를 수신하여 MongoDB에 저장
 *
 * ## 수신 토픽 패턴
 * - topicPattern = ".*-events-dlt"
 * - ecommerce-events-dlt
 * - payment-events-dlt
 * - cash-gateway-events-dlt
 * - progression-events-dlt
 *
 * ## 헤더 정보 (KafkaErrorHandlerConfig에서 추가)
 * - x-failed-service: 실패한 서비스명
 * - x-failed-consumer-group: Consumer Group ID
 * - x-failed-at: 실패 시각
 * - x-failed-reason: 실패 사유
 * - Spring Kafka DLT 기본 헤더들도 포함
 *
 * ## Discord 알림
 * - 현재는 로그만 남김
 * - 향후 Discord Webhook, Slack 통합 예정
 */
@Component
class DLQConsumer(
    private val dlqMessageRepository: DLQMessageRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${spring.application.name:notification-service}") private val serviceName: String
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 모든 DLT 토픽 수신
     *
     * topicPattern으로 "*-events-dlt"로 끝나는 모든 토픽 구독
     */
    @KafkaListener(
        topicPattern = ".*-events-dlt",
        groupId = "notification-service-dlq",
        containerFactory = "kafkaListenerContainerFactory"
    )
    fun consumeDLQMessage(
        record: ConsumerRecord<String, String>,
        ack: Acknowledgment,
        @Header(KafkaHeaders.RECEIVED_TOPIC) topic: String,
        @Header(KafkaHeaders.RECEIVED_PARTITION) partition: Int,
        @Header(KafkaHeaders.OFFSET) offset: Long,
        @Header(KafkaHeaders.RECEIVED_TIMESTAMP) timestamp: Long,
        // Spring Kafka DLT 기본 헤더
        @Header(value = "kafka_dlt-original-topic", required = false) dltOriginalTopic: String?,
        @Header(value = "kafka_dlt-original-partition", required = false) dltOriginalPartition: Int?,
        @Header(value = "kafka_dlt-original-offset", required = false) dltOriginalOffset: Long?,
        @Header(value = "kafka_dlt-original-timestamp", required = false) dltOriginalTimestamp: Long?,
        @Header(value = "kafka_dlt-exception-fqcn", required = false) dltExceptionClass: String?,
        @Header(value = "kafka_dlt-exception-message", required = false) dltExceptionMessage: String?,
        @Header(value = "kafka_dlt-exception-stacktrace", required = false) dltStackTrace: String?,
        // KafkaErrorHandlerConfig에서 추가한 커스텀 헤더
        @Header(value = "x-failed-service", required = false) failedService: String?,
        @Header(value = "x-failed-consumer-group", required = false) failedConsumerGroup: String?,
        @Header(value = "x-failed-at", required = false) failedAtStr: String?,
        @Header(value = "x-failed-reason", required = false) failedReason: String?
    ) {
        try {
            logger.warn(
                "🚨 DLQ Message Received! topic={}, partition={}, offset={}, originalTopic={}",
                topic, partition, offset, dltOriginalTopic
            )

            // 헤더 정보 수집
            val headers = mutableMapOf<String, String>()
            record.headers().forEach { header ->
                headers[header.key()] = String(header.value())
            }

            // 원본 토픽 결정 (DLT 헤더 우선, 없으면 topic에서 -dlt 제거)
            val originalTopic = dltOriginalTopic ?: topic.removeSuffix("-dlt")

            // Consumer Group 결정
            val consumerGroup = failedConsumerGroup ?: failedService ?: "unknown"

            // BaseDomainEvent 필드 추출 (외벽)
            val eventMetadata = extractEventMetadata(record.value())

            // DLQ 메시지 생성
            val dlqMessage = DLQMessage(
                originalTopic = originalTopic,
                consumerGroup = consumerGroup,
                originalPartition = dltOriginalPartition ?: partition,
                originalOffset = dltOriginalOffset ?: offset,
                originalTimestamp = dltOriginalTimestamp ?: timestamp,
                originalMessage = record.value(),
                // BaseDomainEvent 공통 필드
                aggregateId = eventMetadata.aggregateId,
                eventId = eventMetadata.eventId,
                traceId = eventMetadata.traceId,
                eventType = eventMetadata.eventType,
                eventOccurredAt = eventMetadata.occurredAt,
                // 예외 정보
                exceptionClass = dltExceptionClass ?: "Unknown",
                exceptionMessage = dltExceptionMessage ?: failedReason,
                stackTrace = dltStackTrace,
                failedAt = LocalDateTime.now(),
                retryCount = extractRetryCount(headers),
                status = DLQStatus.PENDING,
                headers = headers
            )

            // MongoDB에 저장
            val saved = dlqMessageRepository.save(dlqMessage)

            logger.error(
                """
                ========================================
                🔴 DLQ Message Saved to MongoDB
                ========================================
                ID: ${saved.id}
                Original Topic: ${saved.originalTopic}
                Consumer Group: ${saved.consumerGroup}
                Original Partition: ${saved.originalPartition}
                Original Offset: ${saved.originalOffset}
                ----------------------------------------
                📦 Event Metadata (외벽):
                Event Type: ${saved.eventType ?: "N/A"}
                Aggregate ID: ${saved.aggregateId ?: "N/A"}
                Event ID: ${saved.eventId ?: "N/A"}
                Trace ID: ${saved.traceId ?: "N/A"}
                Event Occurred At: ${saved.eventOccurredAt ?: "N/A"}
                ----------------------------------------
                ❌ Exception Info:
                Exception: ${saved.exceptionClass}
                Message: ${saved.exceptionMessage}
                Failed At: ${saved.failedAt}
                Retry Count: ${saved.retryCount}
                Failed Service: $failedService
                ========================================
                Original Payload:
                ${saved.originalMessage}
                ========================================
                """.trimIndent()
            )

            // TODO: Discord 알림 전송 (향후 구현)
            // sendDiscordNotification(saved)

            // Kafka 오프셋 커밋
            ack.acknowledge()

            logger.info("DLQ message processed and committed: id={}", saved.id)

        } catch (e: Exception) {
            logger.error(
                "Failed to process DLQ message: topic={}, partition={}, offset={}",
                topic, partition, offset, e
            )
            // DLQ의 DLQ는 없으므로 일단 커밋해서 블로킹 방지
            ack.acknowledge()
        }
    }

    /**
     * 헤더에서 재시도 횟수 추출
     * Spring Kafka ErrorHandler가 자동으로 추가하는 헤더
     */
    private fun extractRetryCount(headers: Map<String, String>): Int {
        return headers["kafka_dlt-exception-attempt"]?.toIntOrNull() ?: 0
    }

    /**
     * BaseDomainEvent 공통 필드 추출 (외벽)
     *
     * Kafka 메시지 구조:
     * ```json
     * {
     *   "eventType": "ProductCreatedEvent",
     *   "aggregateId": "product-123",
     *   "payload": { ... },
     *   "metadata": {
     *     "eventId": "...",
     *     "traceId": "...",
     *     "occurredAt": "..."
     *   }
     * }
     * ```
     *
     * 파싱 실패 시 null 반환 (비도메인 이벤트 메시지)
     */
    private fun extractEventMetadata(json: String): EventMetadata {
        return try {
            val map: Map<String, Any?> = objectMapper.readValue(json)

            val eventType = map["eventType"] as? String
            val aggregateId = map["aggregateId"] as? String

            @Suppress("UNCHECKED_CAST")
            val metadata = map["metadata"] as? Map<String, Any?>

            val eventId = metadata?.get("eventId") as? String
            val traceId = metadata?.get("traceId") as? String
            val occurredAtStr = metadata?.get("occurredAt") as? String

            val occurredAt = if (occurredAtStr != null) {
                try {
                    LocalDateTime.parse(occurredAtStr)
                } catch (e: Exception) {
                    null
                }
            } else null

            EventMetadata(
                eventType = eventType,
                aggregateId = aggregateId,
                eventId = eventId,
                traceId = traceId,
                occurredAt = occurredAt
            )

        } catch (e: Exception) {
            logger.warn("Failed to extract event metadata from JSON, using null values", e)
            EventMetadata(
                eventType = null,
                aggregateId = null,
                eventId = null,
                traceId = null,
                occurredAt = null
            )
        }
    }
}

/**
 * BaseDomainEvent 메타데이터
 */
private data class EventMetadata(
    val eventType: String?,
    val aggregateId: String?,
    val eventId: String?,
    val traceId: String?,
    val occurredAt: LocalDateTime?
)
