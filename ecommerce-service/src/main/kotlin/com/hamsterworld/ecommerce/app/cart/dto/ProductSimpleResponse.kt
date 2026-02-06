package com.hamsterworld.ecommerce.app.cart.dto

import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import com.hamsterworld.ecommerce.domain.product.model.Product
import java.math.BigDecimal

/**
 * 장바구니용 상품 간단 정보
 */
data class ProductSimpleResponse(
    val publicId: String,
    val sku: String,
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val category: ProductCategory,
    val price: BigDecimal,
    val stock: Int,
    val isSoldOut: Boolean
) {
    companion object {
        fun from(product: Product): ProductSimpleResponse {
            return ProductSimpleResponse(
                publicId = product.publicId,
                sku = product.sku,
                name = product.name,
                description = product.description,
                imageUrl = product.imageUrl,
                category = product.category,
                price = product.price,
                stock = product.stock,
                isSoldOut = product.isSoldOut
            )
        }
    }
}
