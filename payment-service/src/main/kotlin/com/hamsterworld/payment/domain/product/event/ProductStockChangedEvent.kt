package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.domain.product.model.Product

data class InternalProductStockChangedEvent(
    val product: Product,
    val stockDelta: Int,
    val reason: String,
    val isRecord: Boolean = true
)
