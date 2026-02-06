package com.hamsterworld.common.domain.audit.repository

import com.hamsterworld.common.domain.audit.model.AuditLog
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository

@Repository
class AuditLogRepository(
    private val auditLogJpaRepository: AuditLogJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {
    fun save(auditLog: AuditLog): AuditLog {
        return auditLogJpaRepository.save(auditLog)
    }
}
