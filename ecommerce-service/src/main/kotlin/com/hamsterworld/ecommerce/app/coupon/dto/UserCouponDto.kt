package com.hamsterworld.ecommerce.app.coupon.dto
import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import java.time.LocalDateTime
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
