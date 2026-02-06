package com.hamsterworld.ecommerce.app.cart.dto

import com.hamsterworld.ecommerce.domain.cartitem.model.CartItem
import com.hamsterworld.ecommerce.domain.product.model.Product

data class CartItemWithProduct(
    val cartItem: CartItem,
    val product: Product
)
