package com.hamsterworld.ecommerce.app.cart.dto
data class CartItemWithProductResponse(
    val cartItem: CartItemResponse,
    val product: ProductSimpleResponse
)
