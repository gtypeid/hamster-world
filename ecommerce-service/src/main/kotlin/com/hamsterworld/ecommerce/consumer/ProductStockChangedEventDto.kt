package com.hamsterworld.ecommerce.consumer
data class ProductStockSynchronizedEventDto(
    val productPublicId: String,
    val ecommerceProductId: String,
    val stock: Int,
    val isSoldOut: Boolean,
    val reason: String
)
@Deprecated("Use ProductStockSynchronizedEventDto instead")
data class ProductStockChangedEventDto(
    val productPublicId: String,
    val ecommerceProductId: String,
    val stock: Int,
    val isSoldOut: Boolean,
    val reason: String
)
