package com.hamsterworld.ecommerce.app.coupon.dto

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Coupon Policy DTO
 *
 * ## 응답 필드
 * - ✅ PublicID만 반환 (Long PK 노출 금지)
 * - ✅ Business Key: couponCode
 * - ✅ merchantPublicId: Merchant Public ID (MERCHANT 쿠폰일 때만)
 */
data class CouponPolicyDto(
    val publicId: String,
    val couponCode: String,
    val name: String,
    val description: String?,
    val issuerType: String,
    val merchantPublicId: String?,  // Merchant Public ID (PLATFORM 쿠폰은 null)
    val status: String,
    val validFrom: LocalDateTime,
    val validUntil: LocalDateTime,
    val minOrderAmount: BigDecimal?,
    val discountType: String,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(couponPolicy: CouponPolicy, merchantPublicId: String?): CouponPolicyDto {
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
                minOrderAmount = couponPolicy.usageCondition.minOrderAmount,
                discountType = couponPolicy.discountEmitter.discountType.name,
                discountValue = couponPolicy.discountEmitter.discountValue,
                maxDiscountAmount = couponPolicy.discountEmitter.maxDiscountAmount,
                createdAt = couponPolicy.createdAt
            )
        }
    }
}
