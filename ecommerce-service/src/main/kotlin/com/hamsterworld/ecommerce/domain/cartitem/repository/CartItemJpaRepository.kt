package com.hamsterworld.ecommerce.domain.cartitem.repository

import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import org.springframework.data.jpa.repository.JpaRepository

interface CartItemJpaRepository : JpaRepository<CartItem, Long> {
    fun findByCartId(cartId: Long): List<CartItem>
    fun findByCartIdAndProductId(cartId: Long, productId: Long): CartItem?
    fun deleteByCartId(cartId: Long)
}
