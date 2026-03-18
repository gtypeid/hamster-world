package com.hamsterworld.cashgateway.consumer

import java.math.BigDecimal

data class OrderStockReservedEventDto(
    val orderPublicId: String,
    val userKeycloakId: String,
    val orderNumber: String,
    val cashAmount: BigDecimal,
    val items: List<OrderItemDto>
)

data class OrderItemDto(
    val productId: String,
    val merchantPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
