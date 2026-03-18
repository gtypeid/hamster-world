package com.hamsterworld.common.domain.outboxevent.repository
import com.hamsterworld.common.domain.outboxevent.model.OutboxEvent
import com.hamsterworld.common.domain.outboxevent.model.OutboxEventStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
@Repository
interface OutboxEventRepository : JpaRepository<OutboxEvent, Long> {
    fun findByStatusOrderByCreatedAtAsc(status: OutboxEventStatus): List<OutboxEvent>
    fun findByStatusAndPublishedAtBefore(
        status: OutboxEventStatus,
        publishedAt: LocalDateTime
    ): List<OutboxEvent>
    fun findByStatusOrderByCreatedAtDesc(status: OutboxEventStatus): List<OutboxEvent>
    fun existsByEventId(eventId: String): Boolean
    fun findByEventId(eventId: String): OutboxEvent?
}
