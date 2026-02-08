package com.hamsterworld.progression.domain.quota.repository

import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.dto.QuotaSearchRequest
import com.hamsterworld.progression.domain.quota.model.QQuota.quota
import com.hamsterworld.progression.domain.quota.model.Quota
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

/**
 * Quota Repository
 * QueryDSL을 사용한 동적 쿼리 지원
 */
@Repository
class QuotaRepository(
    private val jpaRepository: QuotaJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(quotaEntity: Quota): Quota {
        return jpaRepository.save(quotaEntity)
    }

    fun findById(id: Long): Quota? {
        return jpaRepository.findById(id).orElse(null)
    }

    fun findByUserPublicId(userPublicId: String): List<Quota> {
        return jpaRepository.findByUserPublicId(userPublicId)
    }

    fun findByUserPublicIdAndQuotaKey(userPublicId: String, quotaKey: String): Quota? {
        return jpaRepository.findByUserPublicIdAndQuotaKey(userPublicId, quotaKey)
    }

    fun findByCycleType(cycleType: CycleType): List<Quota> {
        return jpaRepository.findByCycleType(cycleType)
    }

    fun findByLastResetAtBefore(dateTime: LocalDateTime): List<Quota> {
        return jpaRepository.findByLastResetAtBefore(dateTime)
    }

    fun existsByUserPublicIdAndQuotaKey(userPublicId: String, quotaKey: String): Boolean {
        return jpaRepository.existsByUserPublicIdAndQuotaKey(userPublicId, quotaKey)
    }

    /**
     * Quota 검색 (List)
     */
    fun findAll(search: QuotaSearchRequest): List<Quota> {
        val query = baseQuery(search)
        return QuerydslExtension.applySorts(query, quota.createdAt, search.sort)
            .fetch()
    }

    /**
     * Quota 검색 (Page)
     */
    fun findAllPage(search: QuotaSearchRequest): Page<Quota> {
        val baseQuery = baseQuery(search)

        // Count query
        val total = jpaQueryFactory
            .select(quota.count())
            .from(quota)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val quotas = QuerydslExtension.applySorts(pagedQuery, quota.createdAt, search.sort)
            .fetch()

        return PageImpl(quotas, PageRequest.of(search.page, search.size), total)
    }

    private fun baseQuery(search: QuotaSearchRequest): JPQLQuery<Quota> {
        return jpaQueryFactory
            .selectFrom(quota)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(search: QuotaSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.between(quota.createdAt, search.from, search.to),
            QuerydslExtension.inOrNullSafe(quota.publicId, search.publicIds),
            QuerydslExtension.eqOrNull(quota.userPublicId, search.userPublicId),
            QuerydslExtension.eqOrNull(quota.quotaKey, search.quotaKey),
            QuerydslExtension.eqOrNull(quota.cycleType, search.cycleType),
            QuerydslExtension.eqOrNull(quota.quotaType, search.quotaType),
            // consumed는 Int이므로 직접 처리
            when {
                search.minConsumed != null && search.maxConsumed != null ->
                    quota.consumed.between(search.minConsumed!!, search.maxConsumed!!)
                search.minConsumed != null ->
                    quota.consumed.goe(search.minConsumed!!)
                search.maxConsumed != null ->
                    quota.consumed.loe(search.maxConsumed!!)
                else -> null
            },
            if (search.isCompleted != null) {
                if (search.isCompleted!!) quota.consumed.goe(quota.maxLimit)
                else quota.consumed.lt(quota.maxLimit)
            } else null,
            if (search.isClaimed != null) {
                if (search.isClaimed!!) quota.claimed.isTrue
                else quota.claimed.isFalse
            } else null
        )
    }
}

