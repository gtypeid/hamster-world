package com.hamsterworld.common.domain.audit.handler

import com.hamsterworld.common.domain.audit.model.AuditLog
import com.hamsterworld.common.domain.audit.repository.AuditLogRepository
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

@Component
class AuditLogEventHandler(
    private val auditLogRepository: AuditLogRepository
) {
    @EventListener
    fun handle(entity: AuditLog) {
        auditLogRepository.save(entity)
    }
}
