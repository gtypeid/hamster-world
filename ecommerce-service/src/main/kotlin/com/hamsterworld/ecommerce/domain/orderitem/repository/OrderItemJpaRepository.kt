package com.hamsterworld.ecommerce.domain.orderitem.repository

import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import org.springframework.data.jpa.repository.JpaRepository

interface OrderItemJpaRepository : JpaRepository<OrderItem, Long> {
    fun findByOrderId(orderId: Long): List<OrderItem>
}
