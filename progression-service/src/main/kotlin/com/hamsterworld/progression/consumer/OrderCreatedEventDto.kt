package com.hamsterworld.progression.consumer

import java.math.BigDecimal

data class OrderCreatedEventDto(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>
)

data class OrderItemDto(
    val productPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
