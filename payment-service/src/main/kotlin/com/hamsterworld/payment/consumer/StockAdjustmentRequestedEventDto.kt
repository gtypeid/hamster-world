package com.hamsterworld.payment.consumer

data class StockAdjustmentRequestedEventDto(
    val productPublicId: String,
    val stock: Int,
    val reason: String
)
