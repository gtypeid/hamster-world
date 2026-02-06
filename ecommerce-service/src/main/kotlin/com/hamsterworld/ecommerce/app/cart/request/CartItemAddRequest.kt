package com.hamsterworld.ecommerce.app.cart.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive

/**
 * 장바구니 아이템 추가 요청
 *
 * 외부 API에서는 public_id (String)을 사용하여 Product를 식별
 */
data class CartItemAddRequest(
    @field:NotBlank(message = "상품 ID는 필수입니다")
    val productPublicId: String,

    @field:Positive(message = "수량은 1 이상이어야 합니다")
    val quantity: Int
)
