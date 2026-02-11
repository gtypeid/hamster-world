package com.hamsterworld.ecommerce.app.order.request

/**
 * 장바구니 → 주문 생성 요청
 *
 * 주문 생성 시 수령한 쿠폰(UserCoupon)을 선택적으로 적용할 수 있습니다.
 * 향후 포인트 사용 등 추가 확장 가능합니다.
 *
 * @param userCouponPublicId 적용할 UserCoupon의 Public ID (선택)
 */
data class CartOrderRequest(
    val userCouponPublicId: String? = null
)
