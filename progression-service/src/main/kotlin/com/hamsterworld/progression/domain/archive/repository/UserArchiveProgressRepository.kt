package com.hamsterworld.progression.domain.archive.repository

import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.progression.domain.archive.dto.ArchiveSearchRequest
import com.hamsterworld.progression.domain.archive.model.QUserArchiveProgress.userArchiveProgress
import com.hamsterworld.progression.domain.archive.model.UserArchiveProgress
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

/**
 * UserArchiveProgress Repository
 * QueryDSL을 사용한 동적 쿼리 지원
 */
@Repository
class UserArchiveProgressRepository(
    private val jpaRepository: UserArchiveProgressJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(progress: UserArchiveProgress): UserArchiveProgress {
        return jpaRepository.save(progress)
    }

    fun findById(id: Long): UserArchiveProgress? {
        return jpaRepository.findById(id).orElse(null)
    }

    fun findByUserPublicId(userPublicId: String): List<UserArchiveProgress> {
        return jpaRepository.findByUserPublicId(userPublicId)
    }

    fun findByUserPublicIdAndArchiveId(userPublicId: String, archiveId: String): UserArchiveProgress? {
        return jpaRepository.findByUserPublicIdAndArchiveId(userPublicId, archiveId)
    }

    fun existsByUserPublicIdAndArchiveId(userPublicId: String, archiveId: String): Boolean {
        return jpaRepository.existsByUserPublicIdAndArchiveId(userPublicId, archiveId)
    }

    fun findByIsCompleted(completed: Boolean): List<UserArchiveProgress> {
        return jpaRepository.findByIsCompleted(completed)
    }

    /**
     * Archive 검색 (List)
     */
    fun findAll(search: ArchiveSearchRequest): List<UserArchiveProgress> {
        val query = baseQuery(search)
        return QuerydslExtension.applySorts(query, userArchiveProgress.createdAt, search.sort)
            .fetch()
    }

    /**
     * Archive 검색 (Page)
     */
    fun findAllPage(search: ArchiveSearchRequest): Page<UserArchiveProgress> {
        val baseQuery = baseQuery(search)

        // Count query
        val total = jpaQueryFactory
            .select(userArchiveProgress.count())
            .from(userArchiveProgress)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val progresses = QuerydslExtension.applySorts(pagedQuery, userArchiveProgress.createdAt, search.sort)
            .fetch()

        return PageImpl(progresses, PageRequest.of(search.page, search.size), total)
    }

    private fun baseQuery(search: ArchiveSearchRequest): JPQLQuery<UserArchiveProgress> {
        return jpaQueryFactory
            .selectFrom(userArchiveProgress)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(search: ArchiveSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.between(userArchiveProgress.createdAt, search.from, search.to),
            QuerydslExtension.inOrNullSafe(userArchiveProgress.publicId, search.publicIds),
            QuerydslExtension.eqOrNull(userArchiveProgress.userPublicId, search.userPublicId),
            QuerydslExtension.eqOrNull(userArchiveProgress.archiveId, search.archiveId),
            // Note: archiveType은 UserArchiveProgress에 없으므로 제외
            if (search.isCompleted != null) {
                if (search.isCompleted!!) userArchiveProgress.isCompleted.isTrue
                else userArchiveProgress.isCompleted.isFalse
            } else null,
            if (search.isClaimed != null) {
                if (search.isClaimed!!) userArchiveProgress.isClaimed.isTrue
                else userArchiveProgress.isClaimed.isFalse
            } else null
        )
    }
}
