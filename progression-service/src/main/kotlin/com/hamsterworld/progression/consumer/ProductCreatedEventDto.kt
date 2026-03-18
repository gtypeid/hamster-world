package com.hamsterworld.progression.consumer

import java.math.BigDecimal

data class ProductCreatedEventDto(
    val productPublicId: String,
    val sku: String,
    val name: String,
    val price: BigDecimal,
    val initialStock: Int
)
