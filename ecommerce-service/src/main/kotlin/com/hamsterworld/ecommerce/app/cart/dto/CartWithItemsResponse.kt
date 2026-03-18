package com.hamsterworld.ecommerce.app.cart.dto
data class CartWithItemsResponse(
    val cart: CartResponse,
    val items: List<CartItemWithProductResponse> = emptyList()
)
