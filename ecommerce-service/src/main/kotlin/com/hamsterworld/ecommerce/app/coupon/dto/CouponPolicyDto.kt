package com.hamsterworld.ecommerce.app.coupon.dto
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import java.math.BigDecimal
import java.time.LocalDateTime
data class CouponPolicyDto(
    val publicId: String,
    val couponCode: String,
    val name: String,
    val description: String?,
    val issuerType: String,
    val merchantPublicId: String?,
    val status: String,
    val validFrom: LocalDateTime,
    val validUntil: LocalDateTime,
    val couponDays: Int,
    val minOrderAmount: BigDecimal?,
    val discountType: String,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?,
    val targetProducts: List<TargetProductInfo>,
    val createdAt: LocalDateTime
) {
    data class TargetProductInfo(
        val productPublicId: String,
        val productName: String
    )
    companion object {
        fun from(
            couponPolicy: CouponPolicy,
            merchantPublicId: String?,
            targetProducts: List<TargetProductInfo> = emptyList()
        ): CouponPolicyDto {
            return CouponPolicyDto(
                publicId = couponPolicy.publicId,
                couponCode = couponPolicy.couponCode,
                name = couponPolicy.name,
                description = couponPolicy.description,
                issuerType = couponPolicy.issuerType.name,
                merchantPublicId = merchantPublicId,
                status = couponPolicy.status.name,
                validFrom = couponPolicy.validFrom,
                validUntil = couponPolicy.validUntil,
                couponDays = couponPolicy.couponDays,
                minOrderAmount = couponPolicy.usageCondition.minOrderAmount,
                discountType = couponPolicy.discountEmitter.discountType.name,
                discountValue = couponPolicy.discountEmitter.discountValue,
                maxDiscountAmount = couponPolicy.discountEmitter.maxDiscountAmount,
                targetProducts = targetProducts,
                createdAt = couponPolicy.createdAt
            )
        }
    }
}
