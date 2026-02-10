package com.hamsterworld.cashgateway.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

/**
 * Cash Gateway Service 도메인 이벤트 Base
 *
 * 상속받는 모든 이벤트는 자동으로 이 서비스가 소유한 Kafka 토픽으로 발행됩니다.
 *
 * 용도:
 * - 결제 승인 이벤트 (PaymentApprovedEvent)
 * - 결제 실패 이벤트 (PaymentFailedEvent)
 * - 결제 취소 이벤트 (PaymentCancelledEvent)
 */
abstract class CashGatewayDomainEvent(
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
    topic = KafkaTopics.CASH_GATEWAY_EVENTS
)
