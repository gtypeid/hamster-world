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

/**
 * Payment Service 이벤트 Consumer
 *
 * Payment Service에서 발행하는 다음 이벤트를 수신:
 * - PaymentConfirmedEvent: Payment Service 결제 확정 → Order 상태 PAID로 변경
 * - ProductStockSynchronizedEvent: 재고 변경 → E-commerce Service Product 동기화
 * - AccountBalanceSynchronizedEvent: 잔액 변경 → E-commerce Service Account 동기화
 * - OrderStockValidationFailedEvent: 재고 검증 실패 → Order 상태 FAILED로 변경
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * ## 최종 일관성 (Eventual Consistency)
 * - E-commerce Product는 Payment Service의 재고를 동기화받는 Read Model
 * - 이벤트 소싱 불필요 (진실의 원천은 Payment Service)
 *
 * ## 설계 철학
 * - Ecommerce는 Payment Service의 Business Truth만 신뢰
 * - Cash Gateway Communication Truth는 직접 의존하지 않음
 *
 * @see BaseKafkaConsumer
 */
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

    /**
     * PaymentConfirmedEvent 처리 (Payment Service Business Truth 확정)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → PAID
     * - Payment Service가 Payment + Stock + OrderSnapshot 트랜잭션 확정 완료
     *
     * ## 설계 철학
     * - Ecommerce는 Payment Service의 확정 이벤트만 신뢰
     * - Cash Gateway Communication Truth는 직접 의존하지 않음
     */
    private fun handlePaymentConfirmed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentConfirmedEventDto>(parsedEvent.payload)

        // Order 조회 (Public ID 사용)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // gatewayPaymentPublicId 업데이트
        order.gatewayPaymentPublicId = event.gatewayPaymentPublicId

        // Order 상태 변경 (CAS)
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

    /**
     * PaymentProcessFailedEvent 처리 (Payment Service 실패 확정)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → PAYMENT_FAILED
     * - Payment Service가 재고 복원 완료한 상태
     *
     * ## 설계 철학
     * - Ecommerce는 Payment Service의 확정 이벤트만 신뢰
     * - Cash Gateway Communication Truth는 직접 의존하지 않음
     */
    private fun handlePaymentProcessFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentProcessFailedEventDto>(parsedEvent.payload)

        // Order 조회 (Public ID 사용)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // Order 상태 변경 (CAS)
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

    /**
     * PaymentCancelConfirmedEvent 처리 (Payment Service 취소 확정)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → CANCELED
     * - Payment Service가 Payment 생성 + 재고 복원 완료한 상태
     *
     * ## 설계 철학
     * - Ecommerce는 Payment Service의 확정 이벤트만 신뢰
     * - Cash Gateway Communication Truth는 직접 의존하지 않음
     */
    private fun handlePaymentCancelConfirmed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentCancelConfirmedEventDto>(parsedEvent.payload)

        // Order 조회 (Public ID 사용)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // Order 상태 변경 (CAS)
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
     * AccountBalanceSynchronizedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Account 잔액 동기화 (Payment Service로부터)
     * - Account가 없으면 생성, 있으면 해당 accountType 컬럼만 업데이트
     */
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
