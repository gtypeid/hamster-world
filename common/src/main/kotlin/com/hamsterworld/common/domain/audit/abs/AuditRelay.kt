package com.hamsterworld.common.domain.audit.abs

interface AuditRelay {
    fun postLoad(entity: AuditableTarget)
    fun postPersist(entity: AuditableTarget)
    fun postUpdate(entity: AuditableTarget)
    fun postRemove(entity: AuditableTarget)
}
