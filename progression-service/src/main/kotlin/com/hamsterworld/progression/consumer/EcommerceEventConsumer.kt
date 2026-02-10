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

/**
 * Ecommerce Event Consumer
 *
 * Ecommerce Service의 이벤트를 소비하여 Archive와 Quota 업데이트
 *
 * ## 소비 이벤트
 * - OrderCreatedEvent: 주문 생성 (Archive + Quota)
 * - ProductCreatedEvent: 상품 생성 (Archive + Quota)
 * - ReviewCreatedEvent: 리뷰 생성 (미래)
 */
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

    /**
     * Ecommerce Events 토픽 소비
     */
    @KafkaListener(
        topics = [KafkaTopics.ECOMMERCE_EVENTS],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    /**
     * 이벤트 처리 (비즈니스 로직)
     */
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

    /**
     * OrderCreatedEvent 처리
     */
    private fun handleOrderCreated(parsedEvent: ParsedEvent) {
        val eventDto = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)

        logger.info(
            "🛒 Processing OrderCreatedEvent | orderPublicId={} | userPublicId={} | totalPrice={} | traceId={}",
            eventDto.orderPublicId, eventDto.userPublicId, eventDto.totalPrice, parsedEvent.traceId ?: "N/A"
        )

        val eventFilters = mapOf(
            "minAmount" to eventDto.totalPrice.toLong().toString()
        )

        // 1. Archive 처리
        processArchives(eventDto.userPublicId, parsedEvent.eventType, eventFilters)

        // 2. Quota 처리
        processQuotas(eventDto.userPublicId, parsedEvent.eventType, eventFilters)
    }

    /**
     * ProductCreatedEvent 처리
     *
     * TODO: ProductCreatedEvent에 userPublicId 없음 - 상품 생성자 추적 필요 시 이벤트 구조 변경 필요
     */
    private fun handleProductCreated(parsedEvent: ParsedEvent) {
        val eventDto = objectMapper.convertValue<ProductCreatedEventDto>(parsedEvent.payload)

        logger.warn(
            "🏪 ProductCreatedEvent received but skipping - no userPublicId in event | productPublicId={} | sku={} | traceId={}",
            eventDto.productPublicId, eventDto.sku, parsedEvent.traceId ?: "N/A"
        )

        // ProductCreatedEvent에는 userPublicId가 없어서 progression 처리 불가
        // 추후 이벤트 구조 변경 필요
    }

    /**
     * Archive 처리 공통 로직
     */
    private fun processArchives(userPublicId: String, eventType: String, eventFilters: Map<String, String>) {
        val eventBasedArchives = archiveMasterLoader.getEventBasedArchives()

        eventBasedArchives.forEach { archiveMaster ->
            // 이벤트 매칭 체크
            if (!archiveMaster.matchesEvent(eventType, eventFilters)) {
                return@forEach
            }

            // 금액 조건 체크 (있는 경우)
            if (eventFilters.containsKey("minAmount")) {
                val amount = eventFilters["minAmount"]?.toLongOrNull() ?: 0
                if (!archiveMaster.condition?.matchesAmount(amount)!!) {
                    return@forEach
                }
            }

            // 진행도 업데이트 (서비스 사용)
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

    /**
     * Quota 처리 공통 로직
     */
    private fun processQuotas(userPublicId: String, eventType: String, eventFilters: Map<String, String>) {
        val quotaMasters = quotaMasterLoader.getAllQuotaMasters()

        quotaMasters.forEach { quotaMaster ->
            // 이벤트 매칭 체크
            if (!quotaMaster.matchesEvent(eventType, eventFilters)) {
                return@forEach
            }

            try {
                // Quota 소비 (서비스 사용)
                val quota = quotaService.consumeQuota(
                    userPublicId = userPublicId,
                    quotaMaster = quotaMaster,
                    amount = 1
                )

                if (quota.isCompleted()) {
                    logger.info("🎯 Quota completed: quotaKey=${quotaMaster.quotaKey}, user=$userPublicId")
                }
            } catch (e: IllegalStateException) {
                // Limit reached - 정상 케이스, 로깅만
                logger.debug("Quota limit reached: quotaKey=${quotaMaster.quotaKey}, user=$userPublicId")
            }
        }
    }
}
