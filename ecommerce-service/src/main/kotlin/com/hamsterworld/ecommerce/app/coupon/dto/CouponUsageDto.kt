package com.hamsterworld.ecommerce.app.coupon.dto

import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Coupon Usage DTO
 *
 * ## 응답 필드
 * - ✅ PublicID만 반환 (Long PK 노출 금지)
 * - ✅ orderPublicId 포함 (Kafka 이벤트 연동)
 */
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
