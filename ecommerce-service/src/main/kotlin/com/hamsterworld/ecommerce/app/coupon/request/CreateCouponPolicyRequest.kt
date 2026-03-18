package com.hamsterworld.ecommerce.app.coupon.request
import com.hamsterworld.ecommerce.domain.coupon.constant.DiscountType
import java.math.BigDecimal
import java.time.LocalDateTime
data class CreateCouponPolicyRequest(
    val name: String,
    val description: String?,
    val validFrom: LocalDateTime,
    val validUntil: LocalDateTime,
    val couponDays: Int? = null,
    val minOrderAmount: BigDecimal?,
    val conditionFiltersJson: String?,
    val discountType: DiscountType,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?
)
