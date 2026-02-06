package com.hamsterworld.ecommerce.app.cart.dto

import com.hamsterworld.ecommerce.domain.cart.model.Cart
import java.time.LocalDateTime

/**
 * 장바구니 응답 DTO
 */
data class CartResponse(
    val publicId: String,
    val userPublicId: String?,
    val name: String?,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(cart: Cart, userPublicId: String?): CartResponse {
            return CartResponse(
                publicId = cart.publicId,
                userPublicId = userPublicId,
                name = cart.name,
                createdAt = cart.createdAt,
                modifiedAt = cart.modifiedAt
            )
        }
    }
}
