package com.hamsterworld.cashgateway.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

abstract class CashGatewayDomainEvent(
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
    topic = KafkaTopics.CASH_GATEWAY_EVENTS
)
