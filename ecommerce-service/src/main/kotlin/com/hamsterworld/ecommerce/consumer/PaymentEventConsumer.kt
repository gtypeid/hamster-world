package com.hamsterworld.ecommerce.consumer
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.ecommerce.domain.account.service.AccountService
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import com.hamsterworld.ecommerce.domain.product.service.ProductService
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
@Component
class PaymentEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val productService: ProductService,
    private val accountService: AccountService,
    private val orderRepository: OrderRepository
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, KafkaTopics.PAYMENT_EVENTS) {
    @KafkaListener(
        topics = [KafkaTopics.PAYMENT_EVENTS],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }
    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "PaymentConfirmedEvent" -> handlePaymentConfirmed(parsedEvent)
            "PaymentProcessFailedEvent" -> handlePaymentProcessFailed(parsedEvent)
            "PaymentCancelConfirmedEvent" -> handlePaymentCancelConfirmed(parsedEvent)
            "ProductStockSynchronizedEvent" -> handleProductStockSynchronized(parsedEvent)
            "AccountBalanceSynchronizedEvent" -> handleAccountBalanceSynchronized(parsedEvent)
            "OrderStockValidationFailedEvent" -> handleOrderStockValidationFailed(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }
    private fun handlePaymentConfirmed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentConfirmedEventDto>(parsedEvent.payload)
        val order = orderRepository.findByPublicId(event.orderPublicId)
        order.gatewayPaymentPublicId = event.gatewayPaymentPublicId
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.PAYMENT_APPROVED)
        if (updated) {
            logger.info(
                "[결제 확정 완료] Payment Service Business Truth 확정 | orderPublicId={} | paymentPublicId={} | gatewayPaymentPublicId={} | amount={} | status={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, event.gatewayPaymentPublicId, event.amount, event.status,
                parsedEvent.traceId ?: "N/A"
            )
        } else {
            logger.warn(
                "[결제 확정 처리 실패] CAS 업데이트 실패 | orderPublicId={} | currentStatus={} | traceId={}",
                event.orderPublicId, order.status, parsedEvent.traceId ?: "N/A"
            )
        }
    }
    private fun handlePaymentProcessFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentProcessFailedEventDto>(parsedEvent.payload)
        val order = orderRepository.findByPublicId(event.orderPublicId)
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.PAYMENT_FAILED)
        if (updated) {
            logger.warn(
                "[결제 실패 확정] Payment Service Business Truth 확정 (재고 복원 완료) | orderPublicId={} | processPublicId={} | amount={} | reason={} | traceId={}",
                event.orderPublicId, event.processPublicId, event.amount, event.reason,
                parsedEvent.traceId ?: "N/A"
            )
        } else {
            logger.warn(
                "[결제 실패 처리 실패] CAS 업데이트 실패 | orderPublicId={} | currentStatus={} | traceId={}",
                event.orderPublicId, order.status, parsedEvent.traceId ?: "N/A"
            )
        }
    }
    private fun handlePaymentCancelConfirmed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentCancelConfirmedEventDto>(parsedEvent.payload)
        val order = orderRepository.findByPublicId(event.orderPublicId)
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.CANCELED)
        if (updated) {
            logger.info(
                "[결제 취소 확정] Payment Service Business Truth 확정 (Payment 생성 + 재고 복원 완료) | orderPublicId={} | paymentPublicId={} | originPaymentPublicId={} | amount={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, event.originPaymentPublicId, event.amount,
                parsedEvent.traceId ?: "N/A"
            )
        } else {
            logger.warn(
                "[결제 취소 처리 실패] CAS 업데이트 실패 | orderPublicId={} | currentStatus={} | traceId={}",
                event.orderPublicId, order.status, parsedEvent.traceId ?: "N/A"
            )
        }
    }
    private fun handleProductStockSynchronized(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<ProductStockSynchronizedEventDto>(parsedEvent.payload)
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
    private fun handleAccountBalanceSynchronized(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<AccountBalanceSynchronizedEventDto>(parsedEvent.payload)
        accountService.syncBalance(
            userPublicId = event.userPublicId,
            accountType = event.accountType,
            balance = event.balance
        )
        logger.info(
            "잔액 동기화 완료 (Kafka) | userPublicId={} | accountType={} | balance={} | reason={} | traceId={} | eventId={}",
            event.userPublicId, event.accountType, event.balance, event.reason,
            parsedEvent.traceId ?: "N/A", parsedEvent.eventId
        )
    }
    private fun handleOrderStockValidationFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<OrderStockValidationFailedEventDto>(parsedEvent.payload)
        val order = orderRepository.findByPublicId(event.orderPublicId)
        val failedOrder = order.markAsStockValidationFailed(event.failureReason)
        orderRepository.update(failedOrder)
        logger.warn(
            "주문 재고 검증 실패 (Kafka) | orderPublicId={} | orderNumber={} | failureReason={} | insufficientProducts={}개 | traceId={} | eventId={}",
            event.orderPublicId, event.orderNumber, event.failureReason, event.insufficientProducts.size,
            parsedEvent.traceId ?: "N/A", parsedEvent.eventId
        )
        event.insufficientProducts.forEach { product ->
            logger.warn(
                "  - 상품 재고 부족 | productPublicId={} | 요청수량={} | 가용재고={}",
                product.productId, product.requestedQuantity, product.availableStock
            )
        }
    }
}
