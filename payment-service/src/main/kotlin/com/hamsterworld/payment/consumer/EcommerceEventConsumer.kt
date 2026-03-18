package com.hamsterworld.payment.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Component
class EcommerceEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val productService: ProductService
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
        when (parsedEvent.eventType) {
            "ProductCreatedEvent" -> handleProductCreated(parsedEvent)
            "StockAdjustmentRequestedEvent" -> handleStockAdjustment(parsedEvent)
            "OrderCreatedEvent" -> handleOrderCreated(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    private fun handleProductCreated(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<ProductCreatedEventDto>(parsedEvent.payload)

        productService.initializeProductFromEvent(
            ecommerceProductPublicId = event.productPublicId,
            sku = event.sku,
            name = event.name,
            price = event.price,
            initialStock = event.initialStock
        )

        logger.info(
            "Product 생성 완료 (Kafka) | sku={} | initialStock={} | eventId={}",
            event.sku, event.initialStock, parsedEvent.eventId
        )
    }

    private fun handleStockAdjustment(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<StockAdjustmentRequestedEventDto>(parsedEvent.payload)

        productService.adjustStockFromEvent(
            ecommerceProductPublicId = event.productPublicId,
            stock = event.stock,
            reason = event.reason
        )

        logger.info(
            "재고 조정 완료 (Kafka) | productPublicId={} | amount={} | reason={} | eventId={}",
            event.productPublicId, event.stock, event.reason, parsedEvent.eventId
        )
    }

    private fun handleOrderCreated(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)

        logger.info(
            "주문 생성 이벤트 수신 | orderPublicId={} | userPublicId={} | userKeycloakId={} | orderNumber={} | items={}개 | eventId={}",
            event.orderPublicId, event.userPublicId, event.userKeycloakId, event.orderNumber, event.items.size, parsedEvent.eventId
        )

        productService.validateStockForOrder(
            orderPublicId = event.orderPublicId,
            orderNumber = event.orderNumber,
            userPublicId = event.userPublicId,
            userKeycloakId = event.userKeycloakId,
            totalPrice = event.totalPrice,
            couponDiscount = event.couponDiscount ?: BigDecimal.ZERO,
            pointsToUse = event.pointsToUse ?: BigDecimal.ZERO,
            items = event.items
        )

        logger.info(
            "주문 재고 검증 완료 | orderPublicId={} | orderNumber={} | eventId={}",
            event.orderPublicId, event.orderNumber, parsedEvent.eventId
        )
    }
}
