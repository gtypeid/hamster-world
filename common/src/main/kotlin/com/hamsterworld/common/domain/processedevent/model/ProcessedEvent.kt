package com.hamsterworld.common.domain.processedevent.model
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.LocalDateTime
@Entity
@Table(
    name = "processed_events",
    indexes = [
        Index(name = "idx_processed_events_origin_event_id", columnList = "origin_event_id", unique = true),
        Index(name = "idx_processed_events_trace_id", columnList = "trace_id"),
        Index(name = "idx_processed_events_origin_aggregate_id", columnList = "origin_aggregate_id")
    ]
)
class ProcessedEvent(
    @Column(name = "origin_event_id", nullable = false, unique = true, length = 255)
    var originEventId: String = "",
    @Column(name = "event_type", nullable = false, length = 255)
    var eventType: String = "",
    @Column(name = "origin_aggregate_id", length = 255)
    var originAggregateId: String? = null,
    @Column(name = "origin_aggregate_type", length = 100)
    var originAggregateType: String? = null,
    @Column(name = "trace_id", length = 64)
    var traceId: String? = null,
    @Column(name = "consumed_by", nullable = false, length = 255)
    var consumedBy: String = "",
    @Column(name = "processed_at", nullable = false)
    var processedAt: LocalDateTime = LocalDateTime.now()
) : AbsDomain()
