package com.hamsterworld.ecommerce.app.cart.dto

import com.hamsterworld.ecommerce.domain.cart.model.Cart

/**
 * Cart → Order 변환 입력 DTO
 *
 * CartWithItems를 확장하여 주문 생성 시 필요한 추가 정보를 전달합니다.
 * - userCouponPublicId: 적용할 UserCoupon의 Public ID (선택)
 * - 향후 포인트 사용 등 추가 확장 가능
 *
 * ## DomainConverter 패턴
 * DomainConverterAdapter.convert(source, targetType) 에서 source로 사용됩니다.
 * CartToOrderConverter.isSupport()에서 CartOrderInput 타입을 인식합니다.
 */
data class CartOrderInput(
    val cart: Cart,
    val items: List<CartItemWithProduct> = emptyList(),
    val userCouponPublicId: String? = null
) {
    companion object {
        fun from(cartWithItems: CartWithItems, userCouponPublicId: String? = null): CartOrderInput {
            return CartOrderInput(
                cart = cartWithItems.cart,
                items = cartWithItems.items,
                userCouponPublicId = userCouponPublicId
            )
        }
    }
}
