package com.hamsterworld.ecommerce.app.coupon.dto
import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import java.math.BigDecimal
import java.time.LocalDateTime
data class CouponUsageDto(
    val publicId: String,
    val couponCode: String,
    val orderPublicId: String,
    val discountAmount: BigDecimal,
    val usedAt: LocalDateTime
) {
    companion object {
        fun from(couponUsage: CouponUsage): CouponUsageDto {
            return CouponUsageDto(
                publicId = couponUsage.publicId,
                couponCode = couponUsage.couponCode,
                orderPublicId = couponUsage.orderPublicId,
                discountAmount = couponUsage.discountAmount,
                usedAt = couponUsage.createdAt
            )
        }
    }
}
