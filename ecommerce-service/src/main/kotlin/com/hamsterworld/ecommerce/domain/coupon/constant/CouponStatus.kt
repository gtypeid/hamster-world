package com.hamsterworld.ecommerce.domain.coupon.constant

/**
 * Coupon Status
 *
 * 쿠폰 정책의 활성화 상태
 */
enum class CouponStatus {
    /**
     * 활성화 (사용 가능)
     */
    ACTIVE,

    /**
     * 비활성화 (관리자가 중지)
     */
    INACTIVE,

    /**
     * 만료됨 (기간 종료)
     */
    EXPIRED
}
