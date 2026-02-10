package com.hamsterworld.payment.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

/**
 * Payment Service 도메인 이벤트 Base
 *
 * 상속받는 모든 이벤트는 자동으로 이 서비스가 소유한 Kafka 토픽으로 발행됩니다.
 *
 * 용도:
 * - 재고 변경 이벤트 (ProductStockSynchronizedEvent)
 * - 결제 이벤트 (PaymentCompletedEvent, PaymentFailedEvent 등)
 * - 재고 확보/복구 이벤트 (OrderStockReservedEvent, StockRestoredEvent 등)
 */
abstract class PaymentDomainEvent(
    aggregateId: String,
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    spanId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt,
    topic = KafkaTopics.PAYMENT_EVENTS
)
