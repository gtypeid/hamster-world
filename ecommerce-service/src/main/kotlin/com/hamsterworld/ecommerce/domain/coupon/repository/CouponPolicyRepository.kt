package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponStatus
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import com.hamsterworld.ecommerce.domain.coupon.model.QCouponPolicy.couponPolicy as qCouponPolicy
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDate

/**
 * Coupon Policy Repository
 *
 * QueryDSL 기반 복잡한 쿼리 처리
 */
@Repository
class CouponPolicyRepository(
    private val couponPolicyJpaRepository: CouponPolicyJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(couponPolicy: CouponPolicy): CouponPolicy {
        return couponPolicyJpaRepository.save(couponPolicy)
    }

    fun findById(id: Long): CouponPolicy {
        return couponPolicyJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("쿠폰 정책을 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): CouponPolicy {
        return jpaQueryFactory
            .selectFrom(qCouponPolicy)
            .where(qCouponPolicy.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("쿠폰 정책을 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findByCouponCode(couponCode: String): CouponPolicy? {
        return couponPolicyJpaRepository.findByCouponCode(couponCode)
    }

    fun findByCouponCodeOrThrow(couponCode: String): CouponPolicy {
        return findByCouponCode(couponCode)
            ?: throw CustomRuntimeException("쿠폰을 찾을 수 없습니다. 쿠폰 코드: $couponCode")
    }

    /**
     * 쿠폰 정책 검색 (필터링)
     */
    fun searchCouponPolicies(
        issuerType: CouponIssuerType?,
        merchantId: Long?,
        status: CouponStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC
    ): List<CouponPolicy> {
        val query = baseQuery(issuerType, merchantId, status, from, to)

        return QuerydslExtension.applySorts(query, qCouponPolicy.createdAt, sort)
            .fetch()
    }

    /**
     * 쿠폰 정책 검색 (페이징)
     */
    fun searchCouponPoliciesPage(
        issuerType: CouponIssuerType?,
        merchantId: Long?,
        status: CouponStatus?,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<CouponPolicy> {
        val baseQuery = baseQuery(issuerType, merchantId, status, from, to)

        // Count query
        val total = jpaQueryFactory
            .select(qCouponPolicy.count())
            .from(qCouponPolicy)
            .where(*searchListConditions(issuerType, merchantId, status, from, to).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qCouponPolicy.createdAt, sort)
            .fetch()

        return PageImpl(
            entities,
            PageRequest.of(page, size),
            total
        )
    }

    /**
     * Base Query
     */
    private fun baseQuery(
        issuerType: CouponIssuerType?,
        merchantId: Long?,
        status: CouponStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): JPAQuery<CouponPolicy> {
        return jpaQueryFactory
            .selectFrom(qCouponPolicy)
            .where(*searchListConditions(issuerType, merchantId, status, from, to).toTypedArray())
    }

    /**
     * Search List Conditions
     */
    private fun searchListConditions(
        issuerType: CouponIssuerType?,
        merchantId: Long?,
        status: CouponStatus?,
        from: LocalDate?,
        to: LocalDate?
    ): List<BooleanExpression> {
        return listOfNotNull(
            QuerydslExtension.eqOrNull(qCouponPolicy.issuerType, issuerType),
            QuerydslExtension.eqOrNull(qCouponPolicy.merchantId, merchantId),
            QuerydslExtension.eqOrNull(qCouponPolicy.status, status),
            QuerydslExtension.between(qCouponPolicy.createdAt, from, to)
        )
    }
}
