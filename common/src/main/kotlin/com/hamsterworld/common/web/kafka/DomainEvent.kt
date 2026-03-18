package com.hamsterworld.common.web.kafka
import java.time.LocalDateTime
import java.util.UUID
interface DomainEvent {
    val eventId: String
    val aggregateId: String
    val aggregateType: String
    val traceId: String?
    val spanId: String?
    val occurredAt: LocalDateTime
}
abstract class BaseDomainEvent(
    override val aggregateId: String,
    override val aggregateType: String,
    override val eventId: String = UUID.randomUUID().toString(),
    override val traceId: String? = null,
    override val spanId: String? = null,
    override val occurredAt: LocalDateTime = LocalDateTime.now(),
    open val topic: String
) : DomainEvent
