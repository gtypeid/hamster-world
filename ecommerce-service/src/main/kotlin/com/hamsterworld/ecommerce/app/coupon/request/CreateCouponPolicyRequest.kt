package com.hamsterworld.ecommerce.app.coupon.request

import com.hamsterworld.ecommerce.domain.coupon.constant.DiscountType
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Create Coupon Policy Request
 *
 * 쿠폰 정책 생성 요청
 *
 * ## 쿠폰 코드
 * - 시스템이 자동 생성 (예: CPN_20260208123045_A1B2C3D4)
 * - Request에 포함하지 않음
 *
 * ## 쿠폰 타입
 * - PLATFORM 쿠폰: Admin이 생성 (모든 상품에 적용)
 * - MERCHANT 쿠폰: Merchant가 생성 (자신의 상품에만 적용)
 *
 * ## merchantId
 * - Controller에서 @AuthenticatedMerchant로 주입됨
 * - Request에 포함하지 않음
 */
data class CreateCouponPolicyRequest(
    val name: String,
    val description: String?,
    val validFrom: LocalDateTime,
    val validUntil: LocalDateTime,
    val couponDays: Int? = null,  // 발급 후 사용 가능 일수 (null이면 기본 10일)
    val minOrderAmount: BigDecimal?,
    val conditionFiltersJson: String?,  // filtersJson
    val discountType: DiscountType,
    val discountValue: BigDecimal,
    val maxDiscountAmount: BigDecimal?
)
