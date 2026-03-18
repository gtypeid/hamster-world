package com.hamsterworld.common.web.kafka
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.hamsterworld.common.domain.processedevent.model.ProcessedEvent
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.tracing.TraceContextHolder
import com.hamsterworld.common.web.threadlocal.AuditContext
import com.hamsterworld.common.web.threadlocal.AuditContextHolder
import org.slf4j.LoggerFactory
import org.springframework.kafka.support.Acknowledgment
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
abstract class BaseKafkaConsumer(
    protected val objectMapper: ObjectMapper,
    private val processedEventRepository: ProcessedEventRepository,
    private val eventRegistryProperties: EventRegistryProperties,
    private val currentTopic: String
) {
    protected val logger = LoggerFactory.getLogger(javaClass)
    private fun getSubscribedEvents(): Set<String> {
        return eventRegistryProperties.getSubscribedEvents(currentTopic)
    }
    protected fun parseEvent(message: String): ParsedEvent {
        val eventData = objectMapper.readValue<Map<String, Any>>(message)
        val eventType = eventData["eventType"] as? String
            ?: throw IllegalArgumentException("Missing eventType in event")
        val aggregateId = eventData["aggregateId"] as? String
            ?: throw IllegalArgumentException("Missing aggregateId in event")
        val aggregateType = eventData["aggregateType"] as? String
        val metadata = eventData["metadata"] as? Map<*, *>
        val eventId = metadata?.get("eventId") as? String
        val traceId = (eventData["traceId"] as? String) ?: (metadata?.get("traceId") as? String)
        val spanId = metadata?.get("spanId") as? String
        val timestamp = (metadata?.get("occurredAt") as? String)?.let {
            null
        }
        if (traceId != null) {
            AuditContextHolder.setContext(AuditContext(traceId = traceId))
            logger.debug("Set AuditContext for logging: traceId={}", traceId)
        } else {
            logger.warn("Missing traceId in Kafka event metadata", )
        }
        val payload = eventData["payload"] as? Map<String, Any>
            ?: throw IllegalArgumentException("Missing payload")
        return ParsedEvent(
            eventType = eventType,
            eventId = eventId,
            timestamp = timestamp,
            traceId = traceId,
            aggregateId = aggregateId,
            aggregateType = aggregateType,
            payload = payload
        )
    }
    @Transactional(propagation = Propagation.MANDATORY)
    protected abstract fun handleEvent(parsedEvent: ParsedEvent)
    @Transactional(propagation = Propagation.MANDATORY)
    protected open fun consumeEvent(message: String, ack: Acknowledgment) {
        logger.debug("Received event: {}", message)
        try {
            val parsedEvent = parseEvent(message)
            logger.debug(
                "Processing event: type={}, aggregateType={}, aggregateId={}, eventId={}, traceId={}",
                parsedEvent.eventType, parsedEvent.aggregateType, parsedEvent.aggregateId, parsedEvent.eventId, parsedEvent.traceId
            )
            val subscribedEvents = getSubscribedEvents()
            if (!subscribedEvents.contains(parsedEvent.eventType)) {
                logger.debug(
                    "UNSUBSCRIBED_EVENT | topic={} | eventType={} | eventId={} | traceId={} | subscribedEvents={} | action=SKIP",
                    currentTopic,
                    parsedEvent.eventType,
                    parsedEvent.eventId ?: "N/A",
                    parsedEvent.traceId ?: "N/A",
                    subscribedEvents
                )
                ack.acknowledge()
                return
            }
            if (parsedEvent.eventId != null) {
                if (processedEventRepository.existsByOriginEventId(parsedEvent.eventId)) {
                    logger.info(
                        "EVENT_ALREADY_PROCESSED | traceId={} | eventType={} | eventId={} | consumer={} | action=SKIP",
                        parsedEvent.traceId ?: "N/A",
                        parsedEvent.eventType,
                        parsedEvent.eventId,
                        this.javaClass.simpleName
                    )
                    ack.acknowledge()
                    return
                }
            }
            handleEvent(parsedEvent)
            if (parsedEvent.eventId != null) {
                val processedEvent = ProcessedEvent(
                    originEventId = parsedEvent.eventId,
                    eventType = parsedEvent.eventType,
                    originAggregateId = parsedEvent.aggregateId,
                    originAggregateType = parsedEvent.aggregateType,
                    traceId = parsedEvent.traceId,
                    consumedBy = this.javaClass.simpleName
                )
                processedEventRepository.save(processedEvent)
            }
            ack.acknowledge()
            logger.info(
                "EVENT_CONSUMED_SUCCESS | traceId={} | eventType={} | aggregateType={} | aggregateId={} | eventId={} | consumer={}",
                parsedEvent.traceId ?: "N/A",
                parsedEvent.eventType,
                parsedEvent.aggregateType ?: "N/A",
                parsedEvent.aggregateId,
                parsedEvent.eventId ?: "N/A",
                this.javaClass.simpleName
            )
        } catch (e: Exception) {
            val parsedEventOrNull = try {
                parseEvent(message)
            } catch (_: Exception) {
                null
            }
            logger.error(
                "EVENT_CONSUMED_FAILED | traceId={} | eventType={} | aggregateId={} | eventId={} | consumer={} | error={}",
                parsedEventOrNull?.traceId ?: "N/A",
                parsedEventOrNull?.eventType ?: "PARSE_FAILED",
                parsedEventOrNull?.aggregateId ?: "UNKNOWN",
                parsedEventOrNull?.eventId ?: "N/A",
                this.javaClass.simpleName,
                e.message,
                e
            )
            throw e
        } finally {
            AuditContextHolder.clear()
        }
    }
}
data class ParsedEvent(
    val eventType: String,
    val aggregateId: String,
    val aggregateType: String?,
    val eventId: String?,
    val traceId: String?,
    val timestamp: Long?,
    val payload: Map<String, Any>
)
