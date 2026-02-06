package com.hamsterworld.payment.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.ParsedEvent
import com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
import com.hamsterworld.payment.domain.product.service.ProductService
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Cash Gateway Service 이벤트 Consumer
 *
 * Cash Gateway에서 발행하는 다음 이벤트를 수신:
 * - PaymentCancelledEvent: 결제 취소 → 재고 복원
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * ## 처리 플로우
 * 1. PaymentCancelledEvent 수신
 * 2. orderPublicId로 원본 주문 조회 (외부 거래는 무시)
 * 3. 주문 항목들의 재고 복원 (ProductRecord 생성)
 * 4. ProductStockChangedEvent 발행 → E-commerce Service 동기화
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
    @Value("\${kafka.topics.cash-gateway-events}") topicName: String
) : BaseKafkaConsumer(objectMapper, processedEventRepository, eventRegistryProperties, topicName) {

    @KafkaListener(
        topics = ["\${kafka.topics.cash-gateway-events}"],
        containerFactory = "kafkaListenerContainerFactory"
    )
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun consume(message: String, ack: Acknowledgment) {
        super.consumeEvent(message, ack)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun handleEvent(parsedEvent: ParsedEvent) {
        when (parsedEvent.eventType) {
            "PaymentCancelledEvent" -> handlePaymentCancelled(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * PaymentCancelledEvent 처리 (재고 복원)
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 내용
     * 1. orderPublicId로 OrderSnapshotWithItems 조회
     * 2. 주문 항목들의 재고 복원 (ProductRecord 생성: delta = +quantity)
     * 3. ProductStockChangedEvent 발행 → E-commerce Service 동기화
     *
     * ## 주의사항
     * - orderPublicId가 없으면 외부 거래 → 무시
     * - OrderSnapshot이 없으면 재고 복원 불가 (경고 로그)
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

        // OrderSnapshot + Items 조회
        val snapshotWithItems = orderSnapshotRepository.findByOrderPublicIdWithItems(event.orderPublicId)
        if (snapshotWithItems == null) {
            logger.warn(
                "[재고 복원 실패] OrderSnapshot 없음 | orderPublicId={} | paymentPublicId={} | traceId={}",
                event.orderPublicId, event.paymentPublicId, parsedEvent.traceId ?: "N/A"
            )
            return
        }

        // 재고 복원
        productService.restoreStockForOrder(
            orderPublicId = event.orderPublicId,
            items = snapshotWithItems.items,
            reason = "[결제 취소 복원] orderPublicId=${event.orderPublicId}, paymentPublicId=${event.paymentPublicId}"
        )

        logger.info(
            "[재고 복원 완료] orderPublicId={} | paymentPublicId={} | originPaymentPublicId={} | items={}개 | amount={} | traceId={}",
            event.orderPublicId, event.paymentPublicId, event.originPaymentPublicId, snapshotWithItems.items.size, event.amount,
            parsedEvent.traceId ?: "N/A"
        )
    }
}
