package com.hamsterworld.ecommerce.app.product.dto
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import java.math.BigDecimal
import java.time.LocalDateTime
data class ProductCouponInfo(
    val couponPolicyPublicId: String,
    val couponCode: String,
    val name: String,
    val discountType: String,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?,
    val minOrderAmount: BigDecimal,
    val validUntil: LocalDateTime
) {
    companion object {
        fun from(couponPolicy: CouponPolicy): ProductCouponInfo {
            return ProductCouponInfo(
                couponPolicyPublicId = couponPolicy.publicId,
                couponCode = couponPolicy.couponCode,
                name = couponPolicy.name,
                discountType = couponPolicy.discountEmitter.discountType.name,
                discountValue = couponPolicy.discountEmitter.discountValue,
                maxDiscountAmount = couponPolicy.discountEmitter.maxDiscountAmount,
                minOrderAmount = couponPolicy.usageCondition.minOrderAmount,
                validUntil = couponPolicy.validUntil
            )
        }
    }
}
