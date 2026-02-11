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
    val couponDays: Int,
    val minOrderAmount: BigDecimal?,
    val discountType: String,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?,
    val targetProducts: List<TargetProductInfo>,  // 대상 상품 (비어있으면 전체 상품)
    val createdAt: LocalDateTime
) {
    /**
     * 쿠폰 정책 대상 상품 정보
     */
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
