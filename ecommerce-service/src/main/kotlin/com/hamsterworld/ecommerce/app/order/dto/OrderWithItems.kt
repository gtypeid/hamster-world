package com.hamsterworld.ecommerce.app.order.dto

import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem

data class OrderWithItems(
    val order: Order,
    val items: List<OrderItem> = emptyList()
)
