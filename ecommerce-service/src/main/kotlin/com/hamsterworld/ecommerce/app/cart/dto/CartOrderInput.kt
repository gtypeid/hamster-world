package com.hamsterworld.ecommerce.app.cart.dto
import com.hamsterworld.ecommerce.domain.cart.model.Cart
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
