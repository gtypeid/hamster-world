package com.hamsterworld.ecommerce.app.cart.dto

/**
 * 장바구니 아이템 + 상품 정보
 */
data class CartItemWithProductResponse(
    val cartItem: CartItemResponse,
    val product: ProductSimpleResponse
)
