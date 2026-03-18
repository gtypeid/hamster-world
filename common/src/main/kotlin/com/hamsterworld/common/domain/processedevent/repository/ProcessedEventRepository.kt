package com.hamsterworld.common.domain.processedevent.repository
import com.hamsterworld.common.domain.processedevent.model.ProcessedEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
@Repository
interface ProcessedEventRepository : JpaRepository<ProcessedEvent, Long> {
    fun existsByOriginEventId(originEventId: String): Boolean
    fun findByOriginEventId(originEventId: String): ProcessedEvent?
}
