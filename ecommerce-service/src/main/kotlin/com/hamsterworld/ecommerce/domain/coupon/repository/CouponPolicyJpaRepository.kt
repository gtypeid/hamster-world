package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import org.springframework.data.jpa.repository.JpaRepository

/**
 * Coupon Policy JPA Repository
 *
 * 간단한 JPA 쿼리 메서드
 */
interface CouponPolicyJpaRepository : JpaRepository<CouponPolicy, Long> {
    /**
     * 쿠폰 코드로 조회
     */
    fun findByCouponCode(couponCode: String): CouponPolicy?

    /**
     * 판매자 ID로 조회
     */
    fun findByMerchantId(merchantId: Long): List<CouponPolicy>
}
