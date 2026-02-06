package com.hamsterworld.common.domain.audit.repository

import com.hamsterworld.common.domain.audit.model.AuditLog
import org.springframework.data.jpa.repository.JpaRepository

interface AuditLogJpaRepository : JpaRepository<AuditLog, Long>
