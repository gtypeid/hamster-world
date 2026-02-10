package com.hamsterworld.cashgateway.consumer

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.convertValue
import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.app.payment.service.PaymentService
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import com.hamsterworld.common.domain.processedevent.repository.ProcessedEventRepository
import com.hamsterworld.common.web.kafka.BaseKafkaConsumer
import com.hamsterworld.common.web.kafka.EventRegistryProperties
import com.hamsterworld.common.web.kafka.KafkaTopics
import com.hamsterworld.common.web.kafka.ParsedEvent
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.kafka.support.Acknowledgment
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Payment Service 이벤트 Consumer
 *
 * Payment Service에서 발행하는 다음 이벤트를 수신:
 * - OrderStockReservedEvent: 재고 확보 완료 → PG 결제 요청
 *
 * ## 처리 플로우
 * 1. OrderStockReservedEventDto 파싱
 * 2. DomainConverter로 PaymentApproveRequest 변환
 * 3. PaymentService.approve() 호출 (기존 로직 재사용)
 * 4. PaymentAttempt 생성 + PG 요청 (내부에서 처리)
 *
 * ## 멱등성 전략
 * - **eventId 기반 중복 체크 (BaseKafkaConsumer)**: processed_events 테이블에서 자동 체크
 *
 * @see BaseKafkaConsumer
 * @see PaymentService.approve
 */
@Component
class PaymentEventConsumer(
    objectMapper: ObjectMapper,
    processedEventRepository: ProcessedEventRepository,
    eventRegistryProperties: EventRegistryProperties,
    private val paymentService: PaymentService,
    private val domainConverterAdapter: DomainConverterAdapter
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
            "OrderStockReservedEvent" -> handleOrderStockReserved(parsedEvent)
            else -> logger.debug("Ignoring event: {}", parsedEvent.eventType)
        }
    }

    /**
     * OrderStockReservedEvent 처리
     *
     * ## 멱등성 보장
     * - eventId 체크 (BaseKafkaConsumer, 자동)
     *
     * ## 처리 플로우
     * 1. OrderStockReservedEventDto → PaymentApproveRequest 변환 (DomainConverter)
     * 2. PaymentService.approve() 호출
     * 3. PaymentAttempt 생성 + PG 요청 (Webhook 대기)
     */
    private fun handleOrderStockReserved(parsedEvent: ParsedEvent) {
        val eventDto = objectMapper.convertValue<OrderStockReservedEventDto>(parsedEvent.payload)

        // DomainConverter로 DTO 변환
        val request = domainConverterAdapter.convert(eventDto, PaymentApproveRequest::class.java)

        logger.info(
            "[재고 확보 완료] PG 요청 시작 | orderPublicId={} | userPublicId={} | orderNumber={} | cashAmount={} | provider={} | traceId={}",
            eventDto.orderPublicId, eventDto.userPublicId, eventDto.orderNumber, eventDto.cashAmount,
            request.provider, parsedEvent.traceId ?: "N/A"
        )

        // PaymentService로 위임 (기존 approve 로직 재사용)
        val response = paymentService.approve(request)

        logger.info(
            "[PG 요청 완료] Webhook 대기 중 | orderPublicId={} | message={} | traceId={}",
            eventDto.orderPublicId, response.message, parsedEvent.traceId ?: "N/A"
        )
    }
}
