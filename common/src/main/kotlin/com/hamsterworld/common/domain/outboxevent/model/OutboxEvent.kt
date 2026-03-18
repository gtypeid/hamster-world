package com.hamsterworld.common.domain.outboxevent.model
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
import java.time.LocalDateTime
@Entity
@Table(
    name = "outbox_events",
    indexes = [
        Index(name = "idx_outbox_events_event_id", columnList = "event_id", unique = true),
        Index(name = "idx_outbox_events_status", columnList = "status"),
        Index(name = "idx_outbox_events_created_at", columnList = "created_at")
    ]
)
class OutboxEvent(
    @Column(name = "event_id", nullable = false, unique = true, length = 255)
    var eventId: String = "",
    @Column(name = "event_type", nullable = false, length = 255)
    var eventType: String = "",
    @Column(name = "aggregate_id", nullable = false, length = 255)
    var aggregateId: String = "",
    @Column(name = "aggregate_type", nullable = false, length = 100)
    var aggregateType: String = "",
    @Column(name = "topic", nullable = false, length = 255)
    var topic: String = "",
    @Column(name = "payload", nullable = false, columnDefinition = "MEDIUMTEXT")
    var payload: String = "",
    @Column(name = "trace_id", length = 32)
    var traceId: String? = null,
    @Column(name = "span_id", length = 16)
    var spanId: String? = null,
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: OutboxEventStatus = OutboxEventStatus.PENDING,
    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0,
    @Column(name = "published_at")
    var publishedAt: LocalDateTime? = null,
    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null
) : AbsDomain() {
    fun markAsPublished() {
        this.status = OutboxEventStatus.PUBLISHED
        this.publishedAt = LocalDateTime.now()
        this.errorMessage = null
    }
    fun markAsFailedWithRetry(error: String, maxRetryCount: Int = 3) {
        this.retryCount++
        this.errorMessage = error
        if (this.retryCount >= maxRetryCount) {
            this.status = OutboxEventStatus.FAILED
        }
    }
    fun canPublish(): Boolean {
        return status == OutboxEventStatus.PENDING
    }
}
