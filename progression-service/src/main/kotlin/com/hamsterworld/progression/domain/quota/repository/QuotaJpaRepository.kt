package com.hamsterworld.progression.domain.quota.repository

import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.model.Quota
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * Quota JPA Repository
 * Spring Data JPA 기본 메서드만 제공
 */
interface QuotaJpaRepository : JpaRepository<Quota, Long> {

    fun findByUserPublicId(userPublicId: String): List<Quota>

    fun findByUserPublicIdAndQuotaKey(userPublicId: String, quotaKey: String): Quota?

    fun findByCycleType(cycleType: CycleType): List<Quota>

    fun findByLastResetAtBefore(dateTime: LocalDateTime): List<Quota>

    fun existsByUserPublicIdAndQuotaKey(userPublicId: String, quotaKey: String): Boolean
}
