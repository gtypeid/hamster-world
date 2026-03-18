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
@Component
@ConditionalOnProperty(
    prefix = "outbox.processor",
    name = ["enabled"],
    havingValue = "true",
    matchIfMissing = false
)
class OutboxEventProcessor(
    private val outboxEventRepository: OutboxEventRepository,
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val traceContextHolder: TraceContextHolder
) {
    companion object {
        private val log = LoggerFactory.getLogger(OutboxEventProcessor::class.java)
        private const val MAX_RETRY_COUNT = 3
        private const val BATCH_SIZE = 100
    }
    @Scheduled(fixedDelay = 1000, initialDelay = 1000)
    @Transactional
    fun relay() {
        try {
            val claimed = outboxEventRepository
                .findByStatusOrderByCreatedAtAsc(OutboxEventStatus.PENDING)
                .take(BATCH_SIZE)
            if (claimed.isEmpty()) {
                return
            }
            log.info("Processing {} pending outbox events", claimed.size)
            claimed.forEach { event ->
                try {
                    traceContextHolder.executeWithRestoredTrace(
                        spanName = "outbox-relay",
                        traceId = event.traceId,
                        parentSpanId = event.spanId
                    ) {
                        kafkaTemplate
                            .send(event.topic, event.aggregateId, event.payload)
                            .get()
                        markSent(event)
                        log.info(
                            "Successfully published OutboxEvent - EventId: {}, Type: {}, Topic: {}",
                            event.eventId, event.eventType, event.topic
                        )
                    }
                } catch (ex: Exception) {
                    markFailed(event, ex.message ?: "Unknown error")
                }
            }
        } catch (ex: Exception) {
            log.error("Unexpected error during outbox event processing", ex)
        }
    }
    private fun markSent(event: OutboxEvent) {
        event.markAsPublished()
        outboxEventRepository.save(event)
        log.info(
            "Successfully published OutboxEvent - EventId: {}, Type: {}, Topic: {}",
            event.eventId, event.eventType, event.topic
        )
    }
    private fun markFailed(event: OutboxEvent, errorMessage: String) {
        event.markAsFailedWithRetry(errorMessage, MAX_RETRY_COUNT)
        outboxEventRepository.save(event)
        if (event.status == OutboxEventStatus.FAILED) {
            log.error(
                "OutboxEvent failed permanently after {} retries - EventId: {}, Type: {}, Error: {}",
                MAX_RETRY_COUNT, event.eventId, event.eventType, errorMessage
            )
        } else {
            log.warn(
                "OutboxEvent publish failed, will retry - EventId: {}, Type: {}, RetryCount: {}/{}, Error: {}",
                event.eventId, event.eventType, event.retryCount, MAX_RETRY_COUNT, errorMessage
            )
        }
    }
    @Scheduled(cron = "0 0 2 * * *")
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
