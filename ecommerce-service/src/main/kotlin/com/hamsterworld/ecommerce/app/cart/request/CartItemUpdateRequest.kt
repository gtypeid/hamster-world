package com.hamsterworld.ecommerce.app.cart.request
import jakarta.validation.constraints.Positive
data class CartItemUpdateRequest(
    @field:Positive(message = "수량은 1 이상이어야 합니다")
    val quantity: Int
)
