package com.hamsterworld.ecommerce.domain.cart.repository

import com.hamsterworld.ecommerce.domain.cart.model.Cart
import org.springframework.data.jpa.repository.JpaRepository

interface CartJpaRepository : JpaRepository<Cart, Long> {
    fun findByUserId(userId: Long): Cart?
}
