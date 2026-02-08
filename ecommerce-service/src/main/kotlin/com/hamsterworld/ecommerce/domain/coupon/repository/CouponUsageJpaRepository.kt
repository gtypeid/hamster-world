package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import org.springframework.data.jpa.repository.JpaRepository

/**
 * Coupon Usage JPA Repository
 *
 * 간단한 JPA 쿼리 메서드
 */
interface CouponUsageJpaRepository : JpaRepository<CouponUsage, Long> {
    /**
     * 사용자 + 쿠폰 코드로 조회 (멱등성 체크)
     */
    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): CouponUsage?

    /**
     * 사용자 ID로 사용 내역 조회
     */
    fun findByUserId(userId: Long): List<CouponUsage>

    /**
     * 주문 ID로 사용 내역 조회
     */
    fun findByOrderId(orderId: Long): List<CouponUsage>
}
