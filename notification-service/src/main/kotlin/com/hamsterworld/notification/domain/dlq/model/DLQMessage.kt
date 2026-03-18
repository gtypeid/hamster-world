package com.hamsterworld.notification.domain.dlq.model

import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.LocalDateTime

@Document(collection = "dlq_messages")
data class DLQMessage(
    @Id
    val id: String? = null,

    @Indexed
    val originalTopic: String,

    @Indexed
    val consumerGroup: String,

    val originalPartition: Int,

    val originalOffset: Long,

    val originalTimestamp: Long,

    val originalMessage: String,

    @Indexed
    val aggregateId: String?,

    @Indexed
    val eventId: String?,

    @Indexed
    val traceId: String?,

    @Indexed
    val eventType: String?,

    @Indexed
    val eventOccurredAt: LocalDateTime?,

    @Indexed
    val exceptionClass: String,

    val exceptionMessage: String?,

    val stackTrace: String?,

    @Indexed
    val failedAt: LocalDateTime = LocalDateTime.now(),

    val retryCount: Int = 0,

    @Indexed
    var status: DLQStatus = DLQStatus.PENDING,

    val headers: Map<String, String> = emptyMap(),

    var resolvedAt: LocalDateTime? = null,

    var resolvedBy: String? = null,

    var notes: String? = null,

    var reprocessAttempts: Int = 0,

    var lastReprocessAt: LocalDateTime? = null
) {
    fun markAsReprocessing() {
        this.status = DLQStatus.REPROCESSING
        this.reprocessAttempts++
        this.lastReprocessAt = LocalDateTime.now()
    }

    fun markAsResolved(adminId: String, note: String? = null) {
        this.status = DLQStatus.RESOLVED
        this.resolvedAt = LocalDateTime.now()
        this.resolvedBy = adminId
        if (note != null) {
            this.notes = note
        }
    }

    fun markAsIgnored(adminId: String, reason: String) {
        this.status = DLQStatus.IGNORED
        this.resolvedAt = LocalDateTime.now()
        this.resolvedBy = adminId
        this.notes = "IGNORED: $reason"
    }

    fun getDLTTopicName(): String {
        return "$originalTopic-dlt"
    }
}
