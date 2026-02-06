package com.hamsterworld.ecommerce.app.cart.dto

/**
 * 장바구니 + 아이템 목록 응답
 */
data class CartWithItemsResponse(
    val cart: CartResponse,
    val items: List<CartItemWithProductResponse> = emptyList()
)
