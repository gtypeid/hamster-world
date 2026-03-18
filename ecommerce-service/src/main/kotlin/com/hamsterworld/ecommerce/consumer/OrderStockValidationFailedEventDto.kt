package com.hamsterworld.ecommerce.consumer
data class OrderStockValidationFailedEventDto(
    val orderPublicId: String,
    val orderNumber: String,
    val failureReason: String,
    val insufficientProducts: List<InsufficientProductDto>
)
data class InsufficientProductDto(
    val productId: String,
    val requestedQuantity: Int,
    val availableStock: Int
)
