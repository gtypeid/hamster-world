package com.hamsterworld.ecommerce.app.product.dto

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 상품 상세에 부착되는 발급 가능 쿠폰 정보
 *
 * CouponPolicyProduct → CouponPolicy에서 추출한 경량 DTO
 * 상품 상세 페이지에서 "이 상품에서 발급 가능한 쿠폰" 목록으로 표시
 *
 * 유저가 아직 발급(수령) 전 단계 — 쿠폰 정책 정보만 노출
 */
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
