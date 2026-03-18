package com.hamsterworld.ecommerce.domain.coupon.event
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
data class InternalCouponPolicyCreatedEvent(
    val couponPolicy: CouponPolicy
)
