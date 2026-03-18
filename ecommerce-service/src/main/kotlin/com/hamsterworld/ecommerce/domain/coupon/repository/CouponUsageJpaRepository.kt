package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import org.springframework.data.jpa.repository.JpaRepository
interface CouponUsageJpaRepository : JpaRepository<CouponUsage, Long> {
    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): CouponUsage?
    fun findByUserId(userId: Long): List<CouponUsage>
    fun findByOrderId(orderId: Long): List<CouponUsage>
}
