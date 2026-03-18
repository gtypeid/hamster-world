package com.hamsterworld.common.web.kafka
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID
class KafkaDomainEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper
) {
    companion object {
        private val log = LoggerFactory.getLogger(KafkaDomainEventPublisher::class.java)
    }
    fun handleDomainEvent(event: DomainEvent) {
        try {
            val eventType = event::class.simpleName ?: "UnknownEvent"
            if (event !is BaseDomainEvent) {
                log.debug("Skipping non-BaseDomainEvent: {}", eventType)
                return
            }
            val topic = event.topic
            val eventJson = serializeEvent(event, eventType)
            log.info("Publishing domain event to Kafka - Type: {}, Topic: {}, AggregateId: {}",
                eventType, topic, event.aggregateId)
            kafkaTemplate.send(topic, event.aggregateId, eventJson)
                .whenComplete { result, ex ->
                    if (ex != null) {
                        log.error("Failed to publish domain event: {}, will retry", eventType, ex)
                    } else {
                        log.info("Successfully published domain event: {}", eventType)
                    }
                }
        } catch (ex: Exception) {
            log.error("Unexpected error handling domain event: {}", event::class.simpleName, ex)
        }
    }
    private fun serializeEvent(event: DomainEvent, eventType: String): String {
        val eventId = event.eventId
        val traceId = event.traceId ?: UUID.randomUUID().toString()
        val occurredAt = event.occurredAt
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
