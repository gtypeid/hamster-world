package com.hamsterworld.ecommerce.app.product.request

import java.math.BigDecimal

data class AdjustStockRequest(
    val stock: Int,
    val reason: String
)
