package com.hamsterworld.ecommerce.app.product.request

import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import java.math.BigDecimal

data class CreateProductRequest(
    val sku: String,
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val category: ProductCategory,
    val price: BigDecimal,
    val initialStock: Int
)
