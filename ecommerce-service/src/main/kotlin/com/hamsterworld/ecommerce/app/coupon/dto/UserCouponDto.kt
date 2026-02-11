package com.hamsterworld.ecommerce.app.coupon.dto

import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import java.time.LocalDateTime

/**
 * User Coupon DTO
 *
 * ## 응답 필드
 * - PublicID만 반환 (Long PK 노출 금지)
 * - couponCode: 쿠폰 코드
 * - couponPolicyPublicId: 쿠폰 정책 Public ID (조회 편의)
 */
data class UserCouponDto(
    val publicId: String,
    val couponCode: String,
    val couponPolicyPublicId: String?,
    val couponName: String?,
    val status: String,
    val issuedAt: LocalDateTime,
    val expiresAt: LocalDateTime,
    val usedAt: LocalDateTime?
) {
    companion object {
        fun from(
            userCoupon: UserCoupon,
            couponPolicyPublicId: String? = null,
            couponName: String? = null
        ): UserCouponDto {
            return UserCouponDto(
                publicId = userCoupon.publicId,
                couponCode = userCoupon.couponCode,
                couponPolicyPublicId = couponPolicyPublicId,
                couponName = couponName,
                status = userCoupon.status.name,
                issuedAt = userCoupon.issuedAt,
                expiresAt = userCoupon.expiresAt,
                usedAt = userCoupon.usedAt
            )
        }
    }
}
