package com.hamsterworld.ecommerce.app.cart.request

import jakarta.validation.constraints.Positive

/**
 * 장바구니 아이템 수량 변경 요청
 */
data class CartItemUpdateRequest(
    @field:Positive(message = "수량은 1 이상이어야 합니다")
    val quantity: Int
)
