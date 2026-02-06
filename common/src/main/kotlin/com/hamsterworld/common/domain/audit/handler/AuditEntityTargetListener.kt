package com.hamsterworld.common.domain.audit.handler

import com.hamsterworld.common.domain.audit.abs.AuditRelay
import com.hamsterworld.common.domain.audit.abs.AuditableTarget
import jakarta.persistence.PostLoad
import jakarta.persistence.PostPersist
import jakarta.persistence.PostRemove
import jakarta.persistence.PostUpdate
import org.springframework.stereotype.Component

@Component
class AuditEntityTargetListener(
    private val auditRelay: AuditRelay
) {
    @PostLoad
    fun postLoad(entity: AuditableTarget) {
        auditRelay.postLoad(entity)
    }

    @PostPersist
    fun postPersist(entity: AuditableTarget) {
        auditRelay.postPersist(entity)
    }

    @PostUpdate
    fun postUpdate(entity: AuditableTarget) {
        auditRelay.postUpdate(entity)
    }

    @PostRemove
    fun postRemove(entity: AuditableTarget) {
        auditRelay.postRemove(entity)
    }
}
