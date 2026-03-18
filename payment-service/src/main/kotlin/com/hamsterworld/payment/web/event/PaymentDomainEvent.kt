package com.hamsterworld.payment.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

abstract class PaymentDomainEvent(
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
    topic = KafkaTopics.PAYMENT_EVENTS
)
