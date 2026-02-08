package com.hamsterworld.ecommerce.domain.coupon.constant

/**
 * Coupon Issuer Type
 *
 * 쿠폰 발급 주체
 */
enum class CouponIssuerType {
    /**
     * 플랫폼 쿠폰 (Hamster World 발급)
     */
    PLATFORM,

    /**
     * 판매자 쿠폰 (Merchant 발급)
     */
    MERCHANT
}
