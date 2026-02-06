package com.hamsterworld.common.domain.audit.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "audit_logs",
    indexes = [Index(name = "idx_audit_logs_public_id", columnList = "public_id", unique = true)]
)
class AuditLog(
    var traceId: String = "",
    var targetId: Long = 0,
    var targetType: String = "",
    var operation: String = "",

    @Column(columnDefinition = "MEDIUMTEXT")
    var prev: String? = null,

    @Column(columnDefinition = "MEDIUMTEXT")
    var after: String? = null,

    var userId: Long? = null,
    var userLoginId: String? = null,
    var userName: String? = null
) : AbsDomain()
