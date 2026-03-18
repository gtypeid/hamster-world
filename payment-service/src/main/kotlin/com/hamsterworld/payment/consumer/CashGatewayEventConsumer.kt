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
import com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent
import com.hamsterworld.payment.domain.payment.model.Payment
import com.hamsterworld.payment.domain.payment.repository.PaymentRepository
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.context.ApplicationEventPublisher
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

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

    private fun handlePaymentApproved(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentApprovedEventDto>(parsedEvent.payload)

        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentApprovedEvent 무시 | paymentPublicId={} | traceId={}",
                event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.error(
                "[Payment 생성 실패] OrderSnapshot 없음 | orderPublicId={} | paymentPublicId={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderPublicId=${event.orderPublicId}")
        }

        val payment = Payment.createApproved(
            processPublicId = event.paymentPublicId,
            gatewayPaymentPublicId = event.gatewayPaymentPublicId,
            gatewayMid = event.cashGatewayMid,
            orderPublicId = event.orderPublicId,
            orderSnapshotId = snapshot.id!!,
            amount = event.amount,
            pgTransaction = event.pgTransaction,
            pgApprovalNo = event.pgApprovalNo
        )

        paymentRepository.save(payment)

        logger.info(
            "[Payment 생성 완료] orderPublicId={} | paymentPublicId={} | gatewayPaymentPublicId={} | cashGatewayMid={} | amount={} | traceId={}",
            event.orderPublicId, payment.publicId, event.gatewayPaymentPublicId, event.cashGatewayMid, event.amount,
            parsedEvent.traceId ?: "N/A"
        )
    }

    private fun handlePaymentFailed(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentFailedEventDto>(parsedEvent.payload)

        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentFailedEvent 무시 | processPublicId={} | traceId={}",
                event.processPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.warn(
                "[재고 복원 실패] OrderSnapshot 없음 | orderPublicId={} | processPublicId={} | traceId={}",
                event.orderPublicId, event.processPublicId, parsedEvent.traceId ?: "N/A"
            )
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

        applicationEventPublisher.publishEvent(
            InternalStockRestoreEvent(
                orderPublicId = event.orderPublicId,
                orderSnapshotId = snapshot.id!!,
                reason = "[결제 실패 복원] orderPublicId=${event.orderPublicId}, processPublicId=${event.processPublicId}"
            )
        )

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

    private fun handlePaymentCancelled(parsedEvent: ParsedEvent) {
        val event = objectMapper.convertValue<PaymentCancelledEventDto>(parsedEvent.payload)

        if (event.orderPublicId == null) {
            logger.debug(
                "[외부 거래] PaymentCancelledEvent 무시 | paymentPublicId={} | traceId={}",
                event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        val snapshot = orderSnapshotRepository.findByOrderPublicId(event.orderPublicId)
        if (snapshot == null) {
            logger.error(
                "[Payment 생성 실패] OrderSnapshot 없음 | orderPublicId={} | paymentPublicId={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderPublicId=${event.orderPublicId}")
        }

        val originPayment = paymentRepository.findByGatewayPaymentPublicId(event.originPaymentPublicId)
        if (originPayment == null) {
            logger.error(
                "[Payment 생성 실패] 원본 Payment 없음 | orderPublicId={} | originPaymentPublicId={} | traceId={}",
                event.orderPublicId, event.originPaymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            throw IllegalStateException("원본 Payment를 찾을 수 없습니다. originPaymentPublicId=${event.originPaymentPublicId}")
        }

        val cancelledPayment = Payment.createCancelled(
            processPublicId = event.paymentPublicId,
            gatewayPaymentPublicId = event.gatewayPaymentPublicId,
            gatewayMid = event.cashGatewayMid,
            orderPublicId = event.orderPublicId,
            orderSnapshotId = snapshot.id!!,
            amount = event.amount,
            pgTransaction = event.pgTransaction,
            pgApprovalNo = event.pgApprovalNo,
            originPaymentId = originPayment.id!!,
            originPaymentPublicId = originPayment.publicId
        )

        paymentRepository.save(cancelledPayment)

        logger.info(
            "[Payment 취소 완료] orderPublicId={} | paymentPublicId={} | originPaymentId={} | gatewayPaymentPublicId={} | amount={} | traceId={}",
            event.orderPublicId, cancelledPayment.publicId, originPayment.id, event.gatewayPaymentPublicId,
            event.amount, parsedEvent.traceId ?: "N/A"
        )
    }
}
