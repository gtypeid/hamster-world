package com.hamsterworld.ecommerce.app.product.dto

import com.hamsterworld.ecommerce.domain.product.model.Product
import java.math.BigDecimal
import java.time.LocalDateTime

data class ProductResponse(
    val publicId: String,
    val sku: String,
    val name: String,
    val description: String?,
    val imageUrl: String?,
    val category: String,
    val price: BigDecimal,
    val stock: Int,
    val isSoldOut: Boolean,
    val averageRating: Double,      // 평균 평점 (0.0 ~ 5.0)
    val reviewCount: Int,            // 리뷰 개수
    val lastStockSyncedAt: LocalDateTime?,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(product: Product, averageRating: Double, reviewCount: Int): ProductResponse {
            return ProductResponse(
                publicId = product.publicId,
                sku = product.sku,
                name = product.name,
                description = product.description,
                imageUrl = product.imageUrl,
                category = product.category.name,
                price = product.price,
                stock = product.stock,
                isSoldOut = product.isSoldOut,
                averageRating = averageRating,
                reviewCount = reviewCount,
                lastStockSyncedAt = product.lastStockSyncedAt,
                createdAt = product.createdAt,
                modifiedAt = product.modifiedAt
            )
        }
    }
}
