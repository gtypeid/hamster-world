package com.hamsterworld.common.domain.domainlog.repository

import com.hamsterworld.common.domain.domainlog.domain.DomainLog
import org.springframework.data.jpa.repository.JpaRepository

interface DomainLogJpaRepository : JpaRepository<DomainLog, Long>
