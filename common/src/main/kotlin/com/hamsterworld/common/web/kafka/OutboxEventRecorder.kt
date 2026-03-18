package com.hamsterworld.common.web.kafka
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.domain.outboxevent.model.OutboxEvent
import com.hamsterworld.common.domain.outboxevent.repository.OutboxEventRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID
@Component
class OutboxEventRecorder(
    private val outboxEventRepository: OutboxEventRepository,
    private val objectMapper: ObjectMapper
) {
    companion object {
        private val log = LoggerFactory.getLogger(OutboxEventRecorder::class.java)
    }
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    fun recordDomainEvent(event: DomainEvent) {
        try {
            val eventType = event::class.simpleName ?: "UnknownEvent"
            if (event !is BaseDomainEvent) {
                log.debug("Skipping non-BaseDomainEvent: {}", eventType)
                return
            }
            val topic = event.topic
            val eventId = event.eventId
            val aggregateId = event.aggregateId
            val aggregateType = event.aggregateType
            val payload = serializeEvent(event, eventType)
            val outboxEvent = OutboxEvent(
                eventId = eventId,
                eventType = eventType,
                aggregateId = aggregateId,
                aggregateType = aggregateType,
                topic = topic,
                payload = payload,
                traceId = event.traceId,
                spanId = event.spanId
            )
            outboxEventRepository.save(outboxEvent)
            log.info(
                "Recorded OutboxEvent - Type: {}, Topic: {}, AggregateId: {}, EventId: {}",
                eventType, topic, aggregateId, eventId
            )
        } catch (ex: Exception) {
            log.error("Failed to record OutboxEvent: {}", event::class.simpleName, ex)
            throw ex
        }
    }
    private fun serializeEvent(event: DomainEvent, eventType: String): String {
        val eventId = event.eventId
        val traceId = event.traceId ?: UUID.randomUUID().toString()
        val spanId = event.spanId
        val occurredAt = event.occurredAt
        @Suppress("UNCHECKED_CAST")
        val eventMap = objectMapper.convertValue(event, Map::class.java) as Map<String, Any?>
        val payloadMap = eventMap.filterKeys {
            it !in setOf("aggregateId", "aggregateType", "topic", "eventId", "traceId", "spanId", "occurredAt")
        }
        return objectMapper.writeValueAsString(
            mapOf(
                "eventType" to eventType,
                "aggregateId" to event.aggregateId,
                "aggregateType" to event.aggregateType,
                "traceId" to traceId,
                "payload" to payloadMap,
                "metadata" to mapOf(
                    "eventId" to eventId,
                    "traceId" to traceId,
                    "spanId" to spanId,
                    "occurredAt" to occurredAt
                )
            )
        )
    }
}
