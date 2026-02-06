package com.hamsterworld.ecommerce.app.cart.request

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive

/**
 * 장바구니 전체 설정 요청
 *
 * 장바구니의 모든 아이템을 한번에 설정합니다.
 * - 기존에 있던 아이템이 리스트에 없으면 삭제됩니다.
 * - 리스트에 있는 아이템은 생성 또는 수정됩니다.
 */
data class CartItemsUpdateRequest(
    @field:Valid
    val items: List<CartItemRequest>
)

/**
 * 장바구니 아이템 (상품 ID + 수량)
 */
data class CartItemRequest(
    @field:NotBlank(message = "상품 ID는 필수입니다")
    val productPublicId: String,

    @field:Positive(message = "수량은 1 이상이어야 합니다")
    val quantity: Int
)
