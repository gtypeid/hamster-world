package com.hamsterworld.ecommerce.domain.orderitem.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

@Entity
@Table(
    name = "order_items",
    indexes = [
        Index(name = "idx_order_items_public_id", columnList = "public_id", unique = true)
    ]
)
class OrderItem(
    @Column(nullable = false, name = "order_id")
    var orderId: Long? = null,

    @Column(nullable = false, name = "product_id")
    var productId: Long? = null,  // Internal ID (FK to products table)

    @Column(nullable = false, name = "product_public_id", length = 20)
    var productPublicId: String? = null,  // Product의 Public ID (Kafka 이벤트용)

    var quantity: Int? = null,

    var price: BigDecimal? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        orderId: Long? = this.orderId,
        productId: Long? = this.productId,
        productPublicId: String? = this.productPublicId,
        quantity: Int? = this.quantity,
        price: BigDecimal? = this.price
    ): OrderItem {
        val copied = OrderItem(
            orderId = orderId,
            productId = productId,
            productPublicId = productPublicId,
            quantity = quantity,
            price = price
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
}
