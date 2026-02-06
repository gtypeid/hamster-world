package com.hamsterworld.common.domain.domainlog.repository

import com.hamsterworld.common.domain.domainlog.domain.DomainLog
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository

@Repository
class DomainLogRepository(
    private val domainLogJpaRepository: DomainLogJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {
    fun save(domainLog: DomainLog): DomainLog {
        return domainLogJpaRepository.save(domainLog)
    }
}
