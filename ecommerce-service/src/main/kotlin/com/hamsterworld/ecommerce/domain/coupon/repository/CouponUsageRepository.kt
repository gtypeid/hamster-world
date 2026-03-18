package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import com.hamsterworld.ecommerce.domain.coupon.model.QCouponUsage.couponUsage as qCouponUsage
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import java.time.LocalDate
@Repository
class CouponUsageRepository(
    private val couponUsageJpaRepository: CouponUsageJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {
    fun save(couponUsage: CouponUsage): CouponUsage {
        return couponUsageJpaRepository.save(couponUsage)
    }
    fun findById(id: Long): CouponUsage {
        return couponUsageJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("쿠폰 사용 내역을 찾을 수 없습니다. ID: $id") }
    }
    fun findByPublicId(publicId: String): CouponUsage {
        return jpaQueryFactory
            .selectFrom(qCouponUsage)
            .where(qCouponUsage.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("쿠폰 사용 내역을 찾을 수 없습니다. Public ID: $publicId")
    }
    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): CouponUsage? {
        return couponUsageJpaRepository.findByUserIdAndCouponCode(userId, couponCode)
    }
    fun existsByUserIdAndCouponCode(userId: Long, couponCode: String): Boolean {
        return findByUserIdAndCouponCode(userId, couponCode) != null
    }
    fun searchUserCouponUsages(
        userId: Long,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC
    ): List<CouponUsage> {
        val query = baseUserQuery(userId, from, to)
        return QuerydslExtension.applySorts(query, qCouponUsage.createdAt, sort)
            .fetch()
    }
    fun searchUserCouponUsagesPage(
        userId: Long,
        from: LocalDate?,
        to: LocalDate?,
        sort: SortDirection = SortDirection.DESC,
        page: Int,
        size: Int
    ): Page<CouponUsage> {
        val baseQuery = baseUserQuery(userId, from, to)
        val total = jpaQueryFactory
            .select(qCouponUsage.count())
            .from(qCouponUsage)
            .where(*searchUserConditions(userId, from, to).toTypedArray())
            .fetchOne() ?: 0L
        val pagedQuery = baseQuery
            .offset((page * size).toLong())
            .limit(size.toLong())
        val entities = QuerydslExtension.applySorts(pagedQuery, qCouponUsage.createdAt, sort)
            .fetch()
        return PageImpl(
            entities,
            PageRequest.of(page, size),
            total
        )
    }
    private fun baseUserQuery(
        userId: Long,
        from: LocalDate?,
        to: LocalDate?
    ): JPAQuery<CouponUsage> {
        return jpaQueryFactory
            .selectFrom(qCouponUsage)
            .where(*searchUserConditions(userId, from, to).toTypedArray())
    }
    private fun searchUserConditions(
        userId: Long,
        from: LocalDate?,
        to: LocalDate?
    ): List<BooleanExpression> {
        return listOfNotNull(
            qCouponUsage.userId.eq(userId),
            QuerydslExtension.between(qCouponUsage.createdAt, from, to)
        )
    }
}
