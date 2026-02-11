package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import com.hamsterworld.ecommerce.domain.coupon.model.QUserCoupon.userCoupon as qUserCoupon
import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * User Coupon Repository
 *
 * QueryDSL 기반 복잡한 쿼리 처리
 */
@Repository
class UserCouponRepository(
    private val userCouponJpaRepository: UserCouponJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(userCoupon: UserCoupon): UserCoupon {
        return userCouponJpaRepository.save(userCoupon)
    }

    fun saveAll(userCoupons: List<UserCoupon>): List<UserCoupon> {
        return userCouponJpaRepository.saveAll(userCoupons)
    }

    fun findById(id: Long): UserCoupon {
        return userCouponJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("사용자 쿠폰을 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): UserCoupon {
        return jpaQueryFactory
            .selectFrom(qUserCoupon)
            .where(qUserCoupon.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("사용자 쿠폰을 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findByUserIdAndCouponPolicyId(userId: Long, couponPolicyId: Long): UserCoupon? {
        return userCouponJpaRepository.findByUserIdAndCouponPolicyId(userId, couponPolicyId)
    }

    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): UserCoupon? {
        return userCouponJpaRepository.findByUserIdAndCouponCode(userId, couponCode)
    }

    fun existsByUserIdAndCouponPolicyId(userId: Long, couponPolicyId: Long): Boolean {
        return findByUserIdAndCouponPolicyId(userId, couponPolicyId) != null
    }

    /**
     * 만료 대상 쿠폰 조회 (AVAILABLE + expiresAt이 now 이전)
     */
    fun findExpiredCoupons(now: LocalDateTime = LocalDateTime.now()): List<UserCoupon> {
        return userCouponJpaRepository.findByStatusAndExpiresAtBefore(UserCouponStatus.AVAILABLE, now)
    }

    /**
     * 사용자 쿠폰 검색 (필터링)
     *
     * @param couponPolicyIds null이면 필터 없음, 비어있지 않으면 해당 정책만 조회
     */
    fun searchUserCoupons(
        userId: Long,
        status: UserCouponStatus?,
        from: LocalDate? = null,
        to: LocalDate? = null,
        couponPolicyIds: Set<Long>? = null,
        sort: SortDirection = SortDirection.DESC
    ): List<UserCoupon> {
        val query = baseQuery(userId, status, from, to, couponPolicyIds)

        return QuerydslExtension.applySorts(query, qUserCoupon.issuedAt, sort)
            .fetch()
    }

    /**
     * 사용자 쿠폰 검색 (페이징)
     *
     * @param couponPolicyIds null이면 필터 없음, 비어있지 않으면 해당 정책만 조회
     */
    fun searchUserCouponsPage(
        userId: Long,
        status: UserCouponStatus?,
        from: LocalDate? = null,
        to: LocalDate? = null,
        couponPolicyIds: Set<Long>? = null,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<UserCoupon> {
        val conditions = searchListConditions(userId, status, from, to, couponPolicyIds)
        val baseQuery = jpaQueryFactory
            .selectFrom(qUserCoupon)
            .where(*conditions.toTypedArray())

        val total = jpaQueryFactory
            .select(qUserCoupon.count())
            .from(qUserCoupon)
            .where(*conditions.toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, qUserCoupon.issuedAt, sort)
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
        userId: Long,
        status: UserCouponStatus?,
        from: LocalDate? = null,
        to: LocalDate? = null,
        couponPolicyIds: Set<Long>? = null
    ): JPAQuery<UserCoupon> {
        return jpaQueryFactory
            .selectFrom(qUserCoupon)
            .where(*searchListConditions(userId, status, from, to, couponPolicyIds).toTypedArray())
    }

    /**
     * Search List Conditions
     *
     * @param couponPolicyIds null → 조건 없음 (전체), non-null → IN 조건 적용
     */
    private fun searchListConditions(
        userId: Long,
        status: UserCouponStatus?,
        from: LocalDate? = null,
        to: LocalDate? = null,
        couponPolicyIds: Set<Long>? = null
    ): List<BooleanExpression> {
        return listOfNotNull(
            qUserCoupon.userId.eq(userId),
            QuerydslExtension.eqOrNull(qUserCoupon.status, status),
            QuerydslExtension.between(qUserCoupon.issuedAt, from, to),
            QuerydslExtension.inOrNullSafe(qUserCoupon.couponPolicyId, couponPolicyIds)
        )
    }
}
