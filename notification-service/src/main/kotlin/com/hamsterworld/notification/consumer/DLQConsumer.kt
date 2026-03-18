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

@Component
class DLQConsumer(
    private val dlqMessageRepository: DLQMessageRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${spring.application.name:notification-service}") private val serviceName: String
) {
    private val logger = LoggerFactory.getLogger(javaClass)

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
        @Header(value = "kafka_dlt-original-topic", required = false) dltOriginalTopic: String?,
        @Header(value = "kafka_dlt-original-partition", required = false) dltOriginalPartition: Int?,
        @Header(value = "kafka_dlt-original-offset", required = false) dltOriginalOffset: Long?,
        @Header(value = "kafka_dlt-original-timestamp", required = false) dltOriginalTimestamp: Long?,
        @Header(value = "kafka_dlt-exception-fqcn", required = false) dltExceptionClass: String?,
        @Header(value = "kafka_dlt-exception-message", required = false) dltExceptionMessage: String?,
        @Header(value = "kafka_dlt-exception-stacktrace", required = false) dltStackTrace: String?,
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

            val headers = mutableMapOf<String, String>()
            record.headers().forEach { header ->
                headers[header.key()] = String(header.value())
            }

            val originalTopic = dltOriginalTopic ?: topic.removeSuffix("-dlt")

            val consumerGroup = failedConsumerGroup ?: failedService ?: "unknown"

            val eventMetadata = extractEventMetadata(record.value())

            val dlqMessage = DLQMessage(
                originalTopic = originalTopic,
                consumerGroup = consumerGroup,
                originalPartition = dltOriginalPartition ?: partition,
                originalOffset = dltOriginalOffset ?: offset,
                originalTimestamp = dltOriginalTimestamp ?: timestamp,
                originalMessage = record.value(),
                aggregateId = eventMetadata.aggregateId,
                eventId = eventMetadata.eventId,
                traceId = eventMetadata.traceId,
                eventType = eventMetadata.eventType,
                eventOccurredAt = eventMetadata.occurredAt,
                exceptionClass = dltExceptionClass ?: "Unknown",
                exceptionMessage = dltExceptionMessage ?: failedReason,
                stackTrace = dltStackTrace,
                failedAt = LocalDateTime.now(),
                retryCount = extractRetryCount(headers),
                status = DLQStatus.PENDING,
                headers = headers
            )

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

            ack.acknowledge()

            logger.info("DLQ message processed and committed: id={}", saved.id)

        } catch (e: Exception) {
            logger.error(
                "Failed to process DLQ message: topic={}, partition={}, offset={}",
                topic, partition, offset, e
            )
            ack.acknowledge()
        }
    }

    private fun extractRetryCount(headers: Map<String, String>): Int {
        return headers["kafka_dlt-exception-attempt"]?.toIntOrNull() ?: 0
    }

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

private data class EventMetadata(
    val eventType: String?,
    val aggregateId: String?,
    val eventId: String?,
    val traceId: String?,
    val occurredAt: LocalDateTime?
)
