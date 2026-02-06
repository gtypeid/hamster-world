package com.hamsterworld.ecommerce.app.product.dto

import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.product.model.Product
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 상품 상세 응답 DTO
 *
 * 판매자(Merchant) 정보 + 리뷰 통계 포함
 */
data class ProductDetailResponse(
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
    val merchant: MerchantInfo,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    data class MerchantInfo(
        val publicId: String,
        val storeName: String
    )

    companion object {
        fun from(product: Product, merchant: Merchant, averageRating: Double, reviewCount: Int): ProductDetailResponse {
            return ProductDetailResponse(
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
                merchant = MerchantInfo(
                    publicId = merchant.publicId,
                    storeName = merchant.storeInfo.storeName
                ),
                createdAt = product.createdAt,
                modifiedAt = product.modifiedAt
            )
        }
    }
}
