package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import org.springframework.data.jpa.repository.JpaRepository
interface CouponPolicyJpaRepository : JpaRepository<CouponPolicy, Long> {
    fun findByCouponCode(couponCode: String): CouponPolicy?
    fun findByMerchantId(merchantId: Long): List<CouponPolicy>
}
