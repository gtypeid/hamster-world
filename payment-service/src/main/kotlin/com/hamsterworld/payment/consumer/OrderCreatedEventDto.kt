package com.hamsterworld.payment.consumer

import java.math.BigDecimal

data class OrderCreatedEventDto(
    val orderPublicId: String,
    val userPublicId: String,
    val userKeycloakId: String,
    val orderNumber: String,
    val totalPrice: BigDecimal,
    val items: List<OrderItemDto>,
    val couponDiscount: BigDecimal? = null,
    val pointsToUse: BigDecimal? = null
)

data class OrderItemDto(
    val productPublicId: String,
    val merchantPublicId: String,
    val quantity: Int,
    val price: BigDecimal
)
