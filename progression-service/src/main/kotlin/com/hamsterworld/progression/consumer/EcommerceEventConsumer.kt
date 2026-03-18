package com.hamsterworld.progression.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.progression.domain.archive.service.ArchiveService
import com.hamsterworld.progression.domain.quota.service.QuotaService
import com.hamsterworld.progression.web.csv.ArchiveMasterLoader
import com.hamsterworld.progression.web.csv.QuotaMasterLoader
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
class EcommerceEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val archiveMasterLoader: ArchiveMasterLoader,
    private val quotaMasterLoader: QuotaMasterLoader,
    private val archiveService: ArchiveService,
    private val quotaService: QuotaService
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, KafkaTopics.ECOMMERCE_EVENTS) {

    @KafkaListener(
        topics = [KafkaTopics.ECOMMERCE_EVENTS],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        logger.info("📥 Processing ecommerce event: ${parsedEvent.eventType}")

        when (parsedEvent.eventType) {
            "OrderCreatedEvent" -> handleOrderCreated(parsedEvent)
            "ProductCreatedEvent" -> handleProductCreated(parsedEvent)
            else -> {
                logger.debug("⏭️ Skipping unknown event type: ${parsedEvent.eventType}")
            }
        }
    }

    private fun handleOrderCreated(parsedEvent: ParsedEvent) {
        val eventDto = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)

        logger.info(
            "🛒 Processing OrderCreatedEvent | orderPublicId={} | userPublicId={} | totalPrice={} | traceId={}",
            eventDto.orderPublicId, eventDto.userPublicId, eventDto.totalPrice, parsedEvent.traceId ?: "N/A"
        )

        val eventFilters = mapOf(
            "minAmount" to eventDto.totalPrice.toLong().toString()
        )

        processArchives(eventDto.userPublicId, parsedEvent.eventType, eventFilters)
        processQuotas(eventDto.userPublicId, parsedEvent.eventType, eventFilters)
    }

    private fun handleProductCreated(parsedEvent: ParsedEvent) {
        val eventDto = objectMapper.convertValue<ProductCreatedEventDto>(parsedEvent.payload)

        logger.warn(
            "🏪 ProductCreatedEvent received but skipping - no userPublicId in event | productPublicId={} | sku={} | traceId={}",
            eventDto.productPublicId, eventDto.sku, parsedEvent.traceId ?: "N/A"
        )
    }

    private fun processArchives(userPublicId: String, eventType: String, eventFilters: Map<String, String>) {
        val eventBasedArchives = archiveMasterLoader.getEventBasedArchives()

        eventBasedArchives.forEach { archiveMaster ->
            if (!archiveMaster.matchesEvent(eventType, eventFilters)) {
                return@forEach
            }

            if (eventFilters.containsKey("minAmount")) {
                val amount = eventFilters["minAmount"]?.toLongOrNull() ?: 0
                if (!archiveMaster.condition?.matchesAmount(amount)!!) {
                    return@forEach
                }
            }

            val progress = archiveService.updateArchiveProgress(
                userPublicId = userPublicId,
                archiveId = archiveMaster.archiveId,
                archiveMaster = archiveMaster,
                amount = 1
            )

            if (progress.isCompleted()) {
                logger.info("🎉 Archive completed: archiveId=${archiveMaster.archiveId}, user=$userPublicId")
            }
        }
    }

    private fun processQuotas(userPublicId: String, eventType: String, eventFilters: Map<String, String>) {
        val quotaMasters = quotaMasterLoader.getAllQuotaMasters()

        quotaMasters.forEach { quotaMaster ->
            if (!quotaMaster.matchesEvent(eventType, eventFilters)) {
                return@forEach
            }

            try {
                val quota = quotaService.consumeQuota(
                    userPublicId = userPublicId,
                    quotaMaster = quotaMaster,
                    amount = 1
                )

                if (quota.isCompleted()) {
                    logger.info("🎯 Quota completed: quotaKey=${quotaMaster.quotaKey}, user=$userPublicId")
                }
            } catch (e: IllegalStateException) {
                logger.debug("Quota limit reached: quotaKey=${quotaMaster.quotaKey}, user=$userPublicId")
            }
        }
    }
}
