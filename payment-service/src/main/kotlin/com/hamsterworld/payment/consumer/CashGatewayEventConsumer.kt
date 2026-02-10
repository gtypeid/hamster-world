package com.hamsterworld.payment.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
import com.hamsterworld.payment.domain.payment.event.PaymentProcessFailedEvent
import com.hamsterworld.payment.domain.payment.model.Payment
import com.hamsterworld.payment.domain.payment.repository.PaymentRepository
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Cash Gateway Service 이벤트 Consumer
 *
 * Cash Gateway에서 발행하는 다음 이벤트를 수신:
 * - PaymentApprovedEvent: 결제 승인 → Payment 생성 + PaymentConfirmedEvent 발행
 * - PaymentCancelledEvent: 결제 취소 → 재고 복원
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * ## 처리 플로우
 * ### PaymentApprovedEvent
 * 1. OrderSnapshot 조회 (orderPublicId)
 * 2. Payment 생성 (Payment + OrderSnapshot 트랜잭션)
 * 3. PaymentConfirmedEvent 발행 → Ecommerce Service
 *
 * ### PaymentCancelledEvent
 * 1. orderPublicId로 원본 주문 조회 (외부 거래는 무시)
 * 2. 주문 항목들의 재고 복원 (ProductRecord 생성)
 * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
 *
 * @see BaseKafkaConsumer
 */
@Component
class CashGatewayEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val productService: ProductService,
    private val orderSnapshotRepository: OrderSnapshotRepository,
    private val paymentRepository: PaymentRepository,
    private val applicationEventPublisher: ApplicationEventPublisher
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, KafkaTopics.CASH_GATEWAY_EVENTS) {

    @KafkaListener(
        topics = [KafkaTopics.CASH_GATEWAY_EVENTS],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "PaymentApprovedEvent" -> handlePaymentApproved(parsedEvent)
            "PaymentFailedEvent" -> handlePaymentFailed(parsedEvent)
            "PaymentCancelledEvent" -> handlePaymentCancelled(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * PaymentApprovedEvent 처리 (Payment 생성 + PaymentConfirmedEvent 발행)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. orderPublicId로 OrderSnapshot 조회
     * 2. Payment 생성 (processPublicId, gatewayPaymentPublicId, gatewayMid, orderPublicId, orderSnapshotId, ...)
     * 3. registerEvent(PaymentConfirmedEvent) → save() 시 자동 발행 (아웃박스)
     *
     * ## 주의사항
     * - orderPublicId가 없으면 외부 거래 → 무시
     * - OrderSnapshot이 없으면 Payment 생성 불가 (에러)
     */
    private fun handlePaymentApproved(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentApprovedEventDto>(parsedEvent.payload)

        // 외부 거래는 orderPublicId 없음 → 무시
        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentApprovedEvent 무시 | paymentPublicId={} | traceId={}",
                event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        // OrderSnapshot 조회
        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.error(
                "[Payment 생성 실패] OrderSnapshot 없음 | orderPublicId={} | paymentPublicId={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderPublicId=${event.orderPublicId}")
        }

        // Payment 생성 (팩토리 메서드) → PaymentConfirmedEvent 자동 등록
        val payment = Payment.createApproved(
            processPublicId = event.paymentPublicId,
            gatewayPaymentPublicId = event.gatewayPaymentPublicId,
            gatewayMid = event.mid,
            orderPublicId = event.orderPublicId,
            orderSnapshotId = snapshot.id!!,
            amount = event.amount,
            pgTransaction = event.pgTransaction,
            pgApprovalNo = event.pgApprovalNo
        )

        // Payment 저장 → PaymentConfirmedEvent 자동 발행 (아웃박스)
        paymentRepository.save(payment)

        logger.info(
            "[Payment 생성 완료] orderPublicId={} | paymentPublicId={} | gatewayPaymentPublicId={} | gatewayMid={} | amount={} | traceId={}",
            event.orderPublicId, payment.publicId, event.gatewayPaymentPublicId, event.mid, event.amount,
            parsedEvent.traceId ?: "N/A"
        )
    }

    /**
     * PaymentFailedEvent 처리 (자동 재고 복원 + PaymentProcessFailedEvent 발행)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. orderPublicId로 OrderSnapshot 조회
     * 2. InternalStockRestoreEvent 발행 (재고 복원)
     * 3. PaymentProcessFailedEvent 발행 → Ecommerce Service (Order PAYMENT_FAILED)
     *
     * ## 재고 복원 자동화
     * - InternalStockRestoreEvent 발행 → PaymentEventHandler가 동기 실행
     * - 트랜잭션 원자성: 재고 복원 + 실패 이벤트 발행
     *
     * ## 주의사항
     * - orderPublicId가 없으면 외부 거래 → 무시
     * - OrderSnapshot이 없으면 재고 복원 불가 (경고 로그)
     * - **Payment는 생성하지 않음** (실패는 불변 기록 안 함)
     */
    private fun handlePaymentFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentFailedEventDto>(parsedEvent.payload)

        // 외부 거래는 orderPublicId 없음 → 무시
        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentFailedEvent 무시 | processPublicId={} | traceId={}",
                event.processPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        // OrderSnapshot 조회
        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.warn(
                "[재고 복원 실패] OrderSnapshot 없음 | orderPublicId={} | processPublicId={} | traceId={}",
                event.orderPublicId, event.processPublicId, parsedEvent.traceId ?: "N/A"
            )
            // OrderSnapshot이 없어도 실패 이벤트는 Ecommerce에 전달
            applicationEventPublisher.publishEvent(
                PaymentProcessFailedEvent(
                    processPublicId = event.processPublicId,
                    orderPublicId = event.orderPublicId,
                    amount = event.amount,
                    reason = event.reason,
                    code = event.code,
                    message = event.message
                )
            )
            return
        }

        // InternalStockRestoreEvent 발행 (재고 복원)
        // → PaymentEventHandler가 동기 실행 (같은 트랜잭션)
        applicationEventPublisher.publishEvent(
            com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent(
                orderPublicId = event.orderPublicId,
                orderSnapshotId = snapshot.id!!,
                reason = "[결제 실패 복원] orderPublicId=${event.orderPublicId}, processPublicId=${event.processPublicId}"
            )
        )

        // PaymentProcessFailedEvent 발행 (Ecommerce에 실패 전달)
        applicationEventPublisher.publishEvent(
            PaymentProcessFailedEvent(
                processPublicId = event.processPublicId,
                orderPublicId = event.orderPublicId,
                amount = event.amount,
                reason = event.reason,
                code = event.code,
                message = event.message
            )
        )

        logger.info(
            "[Payment 실패 + 재고 복원 완료] orderPublicId={} | processPublicId={} | amount={} | reason={} | traceId={}",
            event.orderPublicId, event.processPublicId, event.amount, event.reason,
            parsedEvent.traceId ?: "N/A"
        )
    }

    /**
     * PaymentCancelledEvent 처리 (Payment 생성 → 자동 재고 복원)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. orderPublicId로 OrderSnapshot 조회
     * 2. originPaymentPublicId로 원본 Payment 조회
     * 3. Payment 생성 (CANCELLED, 불변 기록)
     *    → InternalStockRestoreEvent 자동 발행 (재고 복원)
     *    → PaymentCancelConfirmedEvent 자동 발행 (Ecommerce 알림)
     *
     * ## 재고 복원 자동화
     * - Payment.createCancelled()가 InternalStockRestoreEvent 발행
     * - PaymentEventHandler가 동기 실행으로 재고 복원
     * - 트랜잭션 원자성: Payment 생성 + 재고 복원
     *
     * ## 주의사항
     * - orderPublicId가 없으면 외부 거래 → 무시
     * - OrderSnapshot이 없으면 Payment 생성 불가 (에러)
     * - 원본 Payment가 없으면 에러 (데이터 정합성 문제)
     */
    private fun handlePaymentCancelled(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentCancelledEventDto>(parsedEvent.payload)

        // 외부 거래는 orderPublicId 없음 → 무시
        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentCancelledEvent 무시 | paymentPublicId={} | traceId={}",
                event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        // OrderSnapshot 조회 (Items는 PaymentEventHandler에서 조회)
        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.error(
                "[Payment 생성 실패] OrderSnapshot 없음 | orderPublicId={} | paymentPublicId={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderPublicId=${event.orderPublicId}")
        }

        // 원본 Payment 조회 (gatewayPaymentPublicId = originPaymentPublicId)
        val originPayment = paymentRepository.findByGatewayPaymentPublicId(event.originPaymentPublicId)
        if (originPayment == null) {
            logger.error(
                "[Payment 생성 실패] 원본 Payment 없음 | orderPublicId={} | originPaymentPublicId={} | traceId={}",
                event.orderPublicId, event.originPaymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("원본 Payment를 찾을 수 없습니다. originPaymentPublicId=${event.originPaymentPublicId}")
        }

        // Payment 생성 (팩토리 메서드) - CANCELLED
        // → InternalStockRestoreEvent 자동 발행 (재고 복원)
        // → PaymentCancelConfirmedEvent 자동 발행 (Ecommerce 알림)
        val cancelledPayment = Payment.createCancelled(
            processPublicId = event.paymentPublicId,
            gatewayPaymentPublicId = event.gatewayPaymentPublicId,
            gatewayMid = event.mid,
            orderPublicId = event.orderPublicId,
            orderSnapshotId = snapshot.id!!,
            amount = event.amount,
            pgTransaction = event.pgTransaction,
            pgApprovalNo = event.pgApprovalNo,
            originPaymentId = originPayment.id!!,
            originPaymentPublicId = originPayment.publicId
        )

        // Payment 저장 → 도메인 이벤트 자동 발행
        // 1. InternalStockRestoreEvent → PaymentEventHandler (재고 복원)
        // 2. PaymentCancelConfirmedEvent → Kafka (Ecommerce 알림)
        paymentRepository.save(cancelledPayment)

        logger.info(
            "[Payment 취소 완료] orderPublicId={} | paymentPublicId={} | originPaymentId={} | gatewayPaymentPublicId={} | amount={} | traceId={}",
            event.orderPublicId, cancelledPayment.publicId, originPayment.id, event.gatewayPaymentPublicId,
            event.amount, parsedEvent.traceId ?: "N/A"
        )
    }
}
