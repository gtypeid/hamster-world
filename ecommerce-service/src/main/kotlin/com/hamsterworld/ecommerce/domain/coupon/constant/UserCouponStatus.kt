package com.hamsterworld.ecommerce.domain.coupon.constant

/**
 * User Coupon Status
 *
 * 사용자 쿠폰 상태
 */
enum class UserCouponStatus {
    /**
     * 사용 가능 (발급 완료, 미사용)
     */
    AVAILABLE,

    /**
     * 사용 완료
     */
    USED,

    /**
     * 만료됨 (사용 기한 초과)
     */
    EXPIRED
}
