package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicyProduct
import org.springframework.data.jpa.repository.JpaRepository
interface CouponPolicyProductJpaRepository : JpaRepository<CouponPolicyProduct, Long> {
    fun findByCouponPolicyId(couponPolicyId: Long): List<CouponPolicyProduct>
    fun findByProductId(productId: Long): List<CouponPolicyProduct>
    fun findByProductIdIn(productIds: List<Long>): List<CouponPolicyProduct>
    fun findByCouponPolicyIdIn(couponPolicyIds: List<Long>): List<CouponPolicyProduct>
    fun deleteByCouponPolicyId(couponPolicyId: Long)
}
