package com.hamsterworld.ecommerce.app.cart.dto
import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import java.time.LocalDateTime
data class CartItemResponse(
    val publicId: String,
    val cartPublicId: String,
    val productPublicId: String,
    val quantity: Int,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(cartItem: CartItem, cartPublicId: String, productPublicId: String): CartItemResponse {
            return CartItemResponse(
                publicId = cartItem.publicId,
                cartPublicId = cartPublicId,
                productPublicId = productPublicId,
                quantity = cartItem.quantity,
                createdAt = cartItem.createdAt,
                modifiedAt = cartItem.modifiedAt
            )
        }
    }
}
