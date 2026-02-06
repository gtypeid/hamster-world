package com.hamsterworld.ecommerce.app.cart.dto

import com.hamsterworld.ecommerce.domain.cart.model.Cart

data class CartWithItems(
    val cart: Cart,
    val items: List<CartItemWithProduct> = emptyList()
)
