package com.hamsterworld.progression.domain.seasonpromotion.repository

import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.progression.domain.seasonpromotion.dto.SeasonPromotionSearchRequest
import com.hamsterworld.progression.domain.seasonpromotion.model.QSeasonPromotion.seasonPromotion
import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotion
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

/**
 * Season Promotion Repository
 * QueryDSL을 사용한 동적 쿼리 지원
 */
@Repository
class SeasonPromotionRepository(
    private val jpaRepository: SeasonPromotionJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(entity: SeasonPromotion): SeasonPromotion {
        return jpaRepository.save(entity)
    }

    fun findById(id: Long): SeasonPromotion? {
        return jpaRepository.findById(id).orElse(null)
    }

    fun findByUserPublicId(userPublicId: String): List<SeasonPromotion> {
        return jpaRepository.findByUserPublicId(userPublicId)
    }

    fun findByUserPublicIdAndPromotionId(userPublicId: String, promotionId: String): SeasonPromotion? {
        return jpaRepository.findByUserPublicIdAndPromotionId(userPublicId, promotionId)
    }

    fun findByPromotionId(promotionId: String): List<SeasonPromotion> {
        return jpaRepository.findByPromotionId(promotionId)
    }

    fun existsByUserPublicIdAndPromotionId(userPublicId: String, promotionId: String): Boolean {
        return jpaRepository.existsByUserPublicIdAndPromotionId(userPublicId, promotionId)
    }

    /**
     * Season Promotion 검색 (List)
     */
    fun findAll(search: SeasonPromotionSearchRequest): List<SeasonPromotion> {
        val query = baseQuery(search)
        return QuerydslExtension.applySorts(query, seasonPromotion.createdAt, search.sort)
            .fetch()
    }

    /**
     * Season Promotion 검색 (Page)
     */
    fun findAllPage(search: SeasonPromotionSearchRequest): Page<SeasonPromotion> {
        val baseQuery = baseQuery(search)

        // Count query
        val total = jpaQueryFactory
            .select(seasonPromotion.count())
            .from(seasonPromotion)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val promotions = QuerydslExtension.applySorts(pagedQuery, seasonPromotion.createdAt, search.sort)
            .fetch()

        return PageImpl(promotions, PageRequest.of(search.page, search.size), total)
    }

    private fun baseQuery(search: SeasonPromotionSearchRequest): JPQLQuery<SeasonPromotion> {
        return jpaQueryFactory
            .selectFrom(seasonPromotion)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(search: SeasonPromotionSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.between(seasonPromotion.createdAt, search.from, search.to),
            QuerydslExtension.inOrNullSafe(seasonPromotion.publicId, search.publicIds),
            QuerydslExtension.eqOrNull(seasonPromotion.userPublicId, search.userPublicId),
            QuerydslExtension.eqOrNull(seasonPromotion.promotionId, search.promotionId),
            if (search.isVip != null) {
                if (search.isVip!!) seasonPromotion.isVip.isTrue
                else seasonPromotion.isVip.isFalse
            } else null,
            when {
                search.minStep != null && search.maxStep != null ->
                    seasonPromotion.currentStep.between(search.minStep!!, search.maxStep!!)
                search.minStep != null ->
                    seasonPromotion.currentStep.goe(search.minStep!!)
                search.maxStep != null ->
                    seasonPromotion.currentStep.loe(search.maxStep!!)
                else -> null
            }
        )
    }
}
