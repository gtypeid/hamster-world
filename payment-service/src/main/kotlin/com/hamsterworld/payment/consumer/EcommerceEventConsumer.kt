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

/**
 * E-commerce Service 이벤트 Consumer
 *
 * E-commerce Service에서 발행하는 다음 이벤트를 수신:
 * - ProductCreatedEvent: 상품 생성 → Payment Service에 Product + ProductRecord 생성
 * - StockAdjustmentRequestedEvent: 재고 조정 → ProductRecord 추가
 * - OrderCreatedEvent: 주문 생성 → 재고 차감 (선차감) + ProductRecord 생성
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * @see BaseKafkaConsumer
 */
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

    /**
     * ProductCreatedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. Product 생성 (최소 메타데이터만)
     * 2. ProductRecord INSERT (초기 재고)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     */
    private fun handleProductCreated(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<ProductCreatedEventDto>(parsedEvent.payload)

        // Product + ProductRecord 생성
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

    /**
     * StockAdjustmentRequestedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. ProductRecord INSERT (재고 변경)
     * 2. Product.stock 재집계
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     */
    private fun handleStockAdjustment(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<StockAdjustmentRequestedEventDto>(parsedEvent.payload)

        // ProductRecord 추가 + 재고 재집계
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

    /**
     * OrderCreatedEvent 처리 (재고 검증)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. 모든 주문 항목의 재고 검증 및 선차감
     * 2. 성공: Product.completeOrder() 호출
     *    - OrderStockReservedEvent 발행 → Cash-Gateway가 PG 요청
     *    - OrderSnapshotCreatedEvent 발행 → OrderSnapshotEventHandler가 DB 저장
     * 3. 실패: OrderStockValidationFailedEvent 발행 → Ecommerce가 주문 실패 처리
     */
    private fun handleOrderCreated(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<OrderCreatedEventDto>(parsedEvent.payload)

        logger.info(
            "주문 생성 이벤트 수신 | orderPublicId={} | userPublicId={} | orderNumber={} | items={}개 | eventId={}",
            event.orderPublicId, event.userPublicId, event.orderNumber, event.items.size, parsedEvent.eventId
        )

        // 재고 검증 및 선차감
        // - 성공 시 Product.completeOrder()가 OrderSnapshotCreatedEvent 발행
        // - OrderSnapshotEventHandler가 수신하여 DB 저장
        productService.validateStockForOrder(
            orderPublicId = event.orderPublicId,
            orderNumber = event.orderNumber,
            userPublicId = event.userPublicId,
            totalPrice = event.totalPrice,
            items = event.items
        )

        logger.info(
            "주문 재고 검증 완료 | orderPublicId={} | orderNumber={} | eventId={}",
            event.orderPublicId, event.orderNumber, parsedEvent.eventId
        )
    }
}
