package com.hamsterworld.ecommerce.domain.product.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import com.hamsterworld.ecommerce.domain.product.event.ProductCreatedEvent
import com.hamsterworld.ecommerce.domain.product.event.StockAdjustmentRequestedEvent
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "products",
    indexes = [
        Index(name = "idx_product_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_products_merchant_id", columnList = "merchantId"),
        Index(name = "idx_product_sku", columnList = "sku"),
        Index(name = "idx_product_category", columnList = "category")
    ]
)
class Product(
    @Column(nullable = false)
    var merchantId: Long = 0,  // Merchant FK (판매자)

    @Column(nullable = false, unique = true, length = 100)
    var sku: String = "",

    @Column(nullable = false, length = 200)
    var name: String = "",

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(length = 500)
    var imageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var category: ProductCategory = ProductCategory.FOOD,

    @Column(nullable = false, precision = 10, scale = 2)
    var price: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false)
    var stock: Int = 0,

    @Column(nullable = false)
    var isSoldOut: Boolean = false,

    @Column
    var lastStockSyncedAt: LocalDateTime? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        merchantId: Long = this.merchantId,
        sku: String = this.sku,
        name: String = this.name,
        description: String? = this.description,
        imageUrl: String? = this.imageUrl,
        category: ProductCategory = this.category,
        price: BigDecimal = this.price,
        stock: Int = this.stock,
        isSoldOut: Boolean = this.isSoldOut,
        lastStockSyncedAt: LocalDateTime? = this.lastStockSyncedAt
    ): Product {
        val copied = Product(
            merchantId = merchantId,
            sku = sku,
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price,
            stock = stock,
            isSoldOut = isSoldOut,
            lastStockSyncedAt = lastStockSyncedAt
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    /**
     * 상품 생성 시 초기 재고 설정 이벤트 등록
     */
    fun onCreate(initialStock: Int): Product {
        registerEvent(
            ProductCreatedEvent(
                productPublicId = this.publicId,
                sku = this.sku,
                name = this.name,
                price = this.price,
                initialStock = initialStock
            )
        )
        return this
    }

    /**
     * 상품 메타데이터 업데이트
     */
    fun updateMetadata(
        name: String,
        description: String?,
        imageUrl: String?,
        category: ProductCategory,
        price: BigDecimal
    ): Product {
        return this.copy(
            name = name,
            description = description,
            imageUrl = imageUrl,
            category = category,
            price = price
        )
    }

    /**
     * 재고 조정 요청 (이벤트 발행)
     */
    fun requestStockAdjustment(newStock: Int, reason: String) {
        registerEvent(
            StockAdjustmentRequestedEvent(
                productPublicId = this.publicId,  // Public ID 사용
                stock = newStock,
                reason = reason
            )
        )
    }

    /**
     * 재고 동기화 (Payment Service로부터)
     */
    fun syncStock(stock: Int, isSoldOut: Boolean): Product {
        return this.copy(
            stock = stock,
            isSoldOut = isSoldOut,
            lastStockSyncedAt = LocalDateTime.now()
        )
    }
}
