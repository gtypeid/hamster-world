package com.hamsterworld.payment.domain.product.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.domain.product.constant.ProductCategory
import com.hamsterworld.payment.domain.product.event.InternalProductStockChangedEvent
import com.hamsterworld.payment.domain.product.event.ProductStockSynchronizedEvent
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
        Index(name = "idx_products_sku", columnList = "sku", unique = true),
        Index(name = "idx_products_ecommerce_product_id", columnList = "ecommerce_product_id"),
        Index(name = "idx_products_public_id", columnList = "public_id", unique = true)
    ]
)
class Product(
    @Column(name = "ecommerce_product_id", length = 20)
    var ecommerceProductId: String? = null,  // E-commerce Product의 Public ID

    @Column(nullable = false, unique = true, length = 100)
    var sku: String = "",

    @Column(nullable = false)
    var weekId: String = "",

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false)
    var price: BigDecimal = BigDecimal.ZERO,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    var stock: Int = 0,

    @Column(nullable = false)
    var isSoldOut: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var category: ProductCategory = ProductCategory.ELECTRONICS,

    var lastRecordedAt: LocalDateTime? = null
) : AbsDomain() {

    /**
     * 재고 변경 (이벤트 소싱 - Delta 방식)
     *
     * @param delta 재고 변화량 (양수: 증가, 음수: 감소)
     * @param reason 변경 사유
     * @return 변경된 Product
     */
    fun updateStockByDelta(delta: Int, reason: String): Product {
        // 현재 재고에 delta 적용
        val newStock = this.stock + delta
        this.stock = newStock
        this.isSoldOut = newStock <= 0
        this.lastRecordedAt = LocalDateTime.now()

        // 1. InternalProductStockChangedEvent 발행 (내부 도메인 이벤트)
        // - ProductEventHandler가 수신하여 ProductRecord 생성 (delta 저장)
        // - Product 객체를 직접 전달하여 영속성 컨텍스트 재조회 방지
        registerEvent(
            InternalProductStockChangedEvent(
                product = this,      // Product 엔티티 자체를 전달
                stockDelta = delta,  // 변화량 (delta)
                reason = reason
            )
        )

        // 2. ProductStockSynchronizedEvent 발행 (Kafka 전송용)
        // - DomainEventPublisher가 OutboxEvent로 저장
        // - OutboxEventProcessor가 Kafka로 전송
        registerEvent(
            ProductStockSynchronizedEvent(
                productPublicId = this.publicId,
                ecommerceProductId = this.ecommerceProductId!!,
                stock = newStock,    // 현재 재고 (절대값)
                isSoldOut = this.isSoldOut,
                reason = reason
            )
        )

        return this
    }

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        ecommerceProductId: String? = this.ecommerceProductId,
        sku: String = this.sku,
        weekId: String = this.weekId,
        name: String = this.name,
        price: BigDecimal = this.price,
        description: String? = this.description,
        stock: Int = this.stock,
        isSoldOut: Boolean = this.isSoldOut,
        category: ProductCategory = this.category,
        lastRecordedAt: LocalDateTime? = this.lastRecordedAt
    ): Product {
        val copied = Product(
            ecommerceProductId = ecommerceProductId,
            sku = sku,
            weekId = weekId,
            name = name,
            price = price,
            description = description,
            stock = stock,
            isSoldOut = isSoldOut,
            category = category,
            lastRecordedAt = lastRecordedAt
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
}
