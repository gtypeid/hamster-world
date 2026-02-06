package com.hamsterworld.ecommerce.domain.cartitem.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "cart_items",
    indexes = [
        Index(name = "idx_cart_items_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_cart_items_cart_product", columnList = "cart_id,product_id", unique = true)
    ]
)
class CartItem(
    @Column(nullable = false, name = "cart_id")
    var cartId: Long,

    @Column(nullable = false, name = "product_id")
    var productId: Long,

    @Column(nullable = false)
    var quantity: Int
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        cartId: Long = this.cartId,
        productId: Long = this.productId,
        quantity: Int = this.quantity
    ): CartItem {
        val copied = CartItem(
            cartId = cartId,
            productId = productId,
            quantity = quantity
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
}
