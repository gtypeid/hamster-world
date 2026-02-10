package com.hamsterworld.ecommerce.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

/**
 * E-commerce Service 도메인 이벤트 Base
 *
 * 상속받는 모든 이벤트는 자동으로 이 서비스가 소유한 Kafka 토픽으로 발행됩니다.
 *
 * 용도:
 * - 상품 이벤트 (ProductCreatedEvent, ProductUpdatedEvent 등)
 * - 재고 조정 요청 이벤트 (StockAdjustmentRequestedEvent)
 * - 주문 이벤트 (OrderCreatedEvent, OrderCancelledEvent 등)
 */
abstract class EcommerceDomainEvent(
    aggregateId: String,
    aggregateType: String,
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    spanId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    aggregateType = aggregateType,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt,
    topic = KafkaTopics.ECOMMERCE_EVENTS
)
