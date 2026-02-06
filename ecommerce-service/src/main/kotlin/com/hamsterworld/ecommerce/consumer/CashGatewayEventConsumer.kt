package com.hamsterworld.ecommerce.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Cash Gateway Service 이벤트 Consumer
 *
 * Cash Gateway에서 발행하는 다음 이벤트를 수신:
 * - PaymentApprovedEvent: 결제 승인 성공 → Order 상태 PAYMENT_APPROVED, gatewayPaymentPublicId 저장
 * - PaymentFailedEvent: 결제 실패 → Order 상태 PAYMENT_FAILED
 * - PaymentCancelledEvent: 결제 취소 → Order 상태 CANCELED
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * ## 처리 플로우
 * 1. PaymentApprovedEvent 수신
 * 2. orderId로 Order 조회
 * 3. Order.status → PAYMENT_APPROVED
 * 4. Order.gatewayPaymentPublicId 저장 (Payment 매칭용)
 *
 * @see BaseKafkaConsumer
 */
@Component
class CashGatewayEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val orderRepository: OrderRepository
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, "cash-gateway-events") {

    @KafkaListener(
        topics = ["cash-gateway-events"],
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
     * PaymentApprovedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → PAYMENT_APPROVED
     * - Order.gatewayPaymentPublicId 저장 (Payment와 매칭용)
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

        // Order 조회 (Public ID로)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // gatewayPaymentPublicId 저장
        order.gatewayPaymentPublicId = event.gatewayPaymentPublicId

        // Order 상태 변경 (CAS)
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.PAYMENT_APPROVED)

        if (updated) {
            logger.info(
                "[결제 승인 성공] orderPublicId={} | paymentPublicId={} | gatewayPaymentPublicId={} | amount={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, event.gatewayPaymentPublicId, event.amount,
                parsedEvent.traceId ?: "N/A"
            )
        } else {
            logger.warn(
                "[결제 승인 실패] CAS 업데이트 실패 | orderPublicId={} | currentStatus={} | traceId={}",
                event.orderPublicId, order.status, parsedEvent.traceId ?: "N/A"
            )
        }
    }

    /**
     * PaymentFailedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → PAYMENT_FAILED
     */
    private fun handlePaymentFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentFailedEventDto>(parsedEvent.payload)

        // 외부 거래는 orderPublicId 없음 → 무시
        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentFailedEvent 무시 | attemptPublicId={} | traceId={}",
                event.attemptPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        // Order 조회 (Public ID로)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // Order 상태 변경 (CAS)
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.PAYMENT_FAILED)

        if (updated) {
            logger.warn(
                "[결제 실패] orderPublicId={} | attemptPublicId={} | reason={} | code={} | traceId={}",
                event.orderPublicId, event.attemptPublicId, event.reason, event.code,
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
     * PaymentCancelledEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * - Order 상태 → CANCELED
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

        // Order 조회 (Public ID로)
        val order = orderRepository.findByPublicId(event.orderPublicId)

        // Order 상태 변경 (CAS)
        val updated = orderRepository.casUpdateStatus(order, OrderStatus.CANCELED)

        if (updated) {
            logger.info(
                "[결제 취소] orderPublicId={} | paymentPublicId={} | originPaymentPublicId={} | amount={} | traceId={}",
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
}
