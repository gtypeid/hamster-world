package com.hamsterworld.payment.app.product.response

import com.hamsterworld.payment.domain.product.constant.ProductCategory
import com.hamsterworld.payment.domain.product.model.Product
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Product 응답 DTO (Public ID만 노출)
 *
 * List/Page API용 - Product 기본 정보만 포함
 */
data class ProductResponse(
    val productPublicId: String,
    val ecommerceProductId: String?,
    val sku: String,
    val weekId: String,
    val name: String,
    val price: BigDecimal,
    val description: String?,
    val stock: Int,
    val isSoldOut: Boolean,
    val category: ProductCategory,
    val lastRecordedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(product: Product): ProductResponse {
            return ProductResponse(
                productPublicId = product.publicId,
                ecommerceProductId = product.ecommerceProductId,
                sku = product.sku,
                weekId = product.weekId,
                name = product.name,
                price = product.price,
                description = product.description,
                stock = product.stock,
                isSoldOut = product.isSoldOut,
                category = product.category,
                lastRecordedAt = product.lastRecordedAt,
                createdAt = product.createdAt,
                modifiedAt = product.modifiedAt
            )
        }
    }
}
