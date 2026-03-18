package com.hamsterworld.ecommerce.app.cart.request
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
data class CartItemAddRequest(
    @field:NotBlank(message = "상품 ID는 필수입니다")
    val productPublicId: String,
    @field:Positive(message = "수량은 1 이상이어야 합니다")
    val quantity: Int
)
