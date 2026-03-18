package com.hamsterworld.common.domain.audit.abs
interface AuditableTarget {
    fun entityId(): String
    fun entityType(): String
}
