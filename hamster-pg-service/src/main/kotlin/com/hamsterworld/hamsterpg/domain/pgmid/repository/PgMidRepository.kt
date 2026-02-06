package com.hamsterworld.hamsterpg.domain.pgmid.repository

import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.hamsterpg.app.pgmid.request.PgMidSearchRequest
import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import com.hamsterworld.hamsterpg.domain.pgmid.model.QPgMid.pgMid as qPgMid
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

@Repository
class PgMidRepository(
    private val jpaRepository: PgMidJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {
    fun save(pgMid: PgMid): PgMid {
        return jpaRepository.save(pgMid)
    }

    fun findById(id: Long): PgMid {
        return jpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("PgMid not found: id=$id") }
    }

    fun findByMidId(midId: String): PgMid {
        return jpaRepository.findByMidId(midId)
            .orElseThrow { CustomRuntimeException("PgMid not found: midId=$midId") }
    }

    fun findByApiKey(apiKey: String): PgMid {
        return jpaRepository.findByApiKey(apiKey)
            .orElseThrow { CustomRuntimeException("PgMid not found: apiKey=$apiKey") }
    }

    fun findAll(): List<PgMid> {
        return jpaRepository.findAll()
    }

    fun searchList(request: PgMidSearchRequest): List<PgMid> {
        val query = baseQuery(request)

        return QuerydslExtension.applySorts(query, qPgMid.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: PgMidSearchRequest): Page<PgMid> {
        val baseQuery = baseQuery(request)

        // Count query
        val total = jpaQueryFactory
            .select(qPgMid.count())
            .from(qPgMid)
            .where(*searchConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qPgMid.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }

    private fun baseQuery(request: PgMidSearchRequest): com.querydsl.jpa.impl.JPAQuery<PgMid> {
        return jpaQueryFactory
            .selectFrom(qPgMid)
            .where(*searchConditions(request).toTypedArray())
    }

    private fun searchConditions(request: PgMidSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.match(qPgMid.midId, request.midId, request.match),
            QuerydslExtension.match(qPgMid.merchantName, request.merchantName, request.match),
            request.isActive?.let { qPgMid.isActive.eq(it) },
            QuerydslExtension.inOrNullSafe(qPgMid.publicId, request.publicIds),
            QuerydslExtension.between(qPgMid.createdAt, request.from, request.to)
        )
    }
}
