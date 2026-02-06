package com.hamsterworld.payment.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
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
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    eventId = eventId,
    traceId = traceId,
    occurredAt = occurredAt,
    topic = PaymentDomainEventTopicProvider.topic
)

/**
 * Spring Property를 사용하여 토픽 이름을 제공하는 컴포넌트
 *
 * kafka-topology.yml에 정의된 토픽을 자동으로 주입받아 사용합니다.
 */
@Component
class PaymentDomainEventTopicProvider {
    companion object {
        lateinit var topic: String
            private set
    }

    @Value("\${kafka.service.payment-service.topic}")
    fun setTopic(topicName: String) {
        topic = topicName
    }
}
