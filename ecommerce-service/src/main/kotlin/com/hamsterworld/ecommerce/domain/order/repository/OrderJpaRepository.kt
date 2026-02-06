package com.hamsterworld.ecommerce.domain.order.repository

import com.hamsterworld.ecommerce.domain.order.model.Order
import org.springframework.data.jpa.repository.JpaRepository

interface OrderJpaRepository : JpaRepository<Order, Long> {
    fun findByUserId(userId: Long): List<Order>
}
