package com.hamsterworld.ecommerce.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Payment Service 이벤트 Consumer
 *
 * Payment Service에서 발행하는 다음 이벤트를 수신:
 * - ProductStockSynchronizedEvent: 재고 변경 → E-commerce Service Product 동기화
 * - OrderStockValidationFailedEvent: 재고 검증 실패 → Order 상태 FAILED로 변경
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * ## 최종 일관성 (Eventual Consistency)
 * - E-commerce Product는 Payment Service의 재고를 동기화받는 Read Model
 * - 이벤트 소싱 불필요 (진실의 원천은 Payment Service)
 *
 * @see BaseKafkaConsumer
 */
@Component
class PaymentEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: com.hamsterworld.common.web.kafka.EventRegistryProperties,
    private val productService: ProductService,
    private val orderRepository: OrderRepository,
    @Value("\${kafka.topics.payment-events}") topicName: String
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, topicName) {

    @KafkaListener(
        topics = ["\${kafka.topics.payment-events}"],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "ProductStockSynchronizedEvent" -> handleProductStockSynchronized(parsedEvent)
            "OrderStockValidationFailedEvent" -> handleOrderStockValidationFailed(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * ProductStockSynchronizedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Product.stock 동기화 (Payment Service로부터)
     * - Product.isSoldOut 동기화
     * - lastStockSyncedAt 업데이트
     */
    private fun handleProductStockSynchronized(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<ProductStockSynchronizedEventDto>(parsedEvent.payload)

        // 재고 동기화 (최종 일관성)
        productService.syncStock(
            productPublicId = event.ecommerceProductId,
            stock = event.stock,
            isSoldOut = event.isSoldOut
        )

        logger.info(
            "재고 동기화 완료 (Kafka) | ecommerceProductId={} | stock={} | isSoldOut={} | reason={} | traceId={} | eventId={}",
            event.ecommerceProductId, event.stock, event.isSoldOut, event.reason,
            parsedEvent.traceId ?: "N/A", parsedEvent.eventId
        )
    }

    /**
     * OrderStockValidationFailedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태를 PAYMENT_FAILED로 변경
     * - 재고 부족 사유 로깅
     */
    private fun handleOrderStockValidationFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<OrderStockValidationFailedEventDto>(parsedEvent.payload)

        // Order 조회 (Public ID 사용)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // 주문 실패 처리 (재고 검증 실패)
        val failedOrder = order.markAsStockValidationFailed(event.failureReason)
        orderRepository.update(failedOrder)

        logger.warn(
            "주문 재고 검증 실패 (Kafka) | orderPublicId={} | orderNumber={} | failureReason={} | insufficientProducts={}개 | traceId={} | eventId={}",
            event.orderPublicId, event.orderNumber, event.failureReason, event.insufficientProducts.size,
            parsedEvent.traceId ?: "N/A", parsedEvent.eventId
        )

        // 재고 부족 상세 로깅
        event.insufficientProducts.forEach { product ->
            logger.warn(
                "  - 상품 재고 부족 | productPublicId={} | 요청수량={} | 가용재고={}",
                product.productId, product.requestedQuantity, product.availableStock
            )
        }
    }
}
