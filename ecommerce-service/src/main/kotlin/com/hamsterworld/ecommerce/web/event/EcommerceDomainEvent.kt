package com.hamsterworld.ecommerce.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
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
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt,
    topic = EcommerceDomainEventTopicProvider.topic
)

/**
 * Spring Property를 사용하여 토픽 이름을 제공하는 컴포넌트
 *
 * kafka-topology.yml에 정의된 토픽을 자동으로 주입받아 사용합니다.
 */
@Component
class EcommerceDomainEventTopicProvider {
    companion object {
        lateinit var topic: String
            private set
    }

    @Value("\${kafka.service.ecommerce-service.topic}")
    fun setTopic(topicName: String) {
        topic = topicName
    }
}
