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
        Index(name = "idx_order_items_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_order_items_merchant_id", columnList = "merchant_id")
    ]
)
class OrderItem(
    @Column(nullable = false, name = "order_id")
    var orderId: Long? = null,

    @Column(nullable = false, name = "product_id")
    var productId: Long? = null,

    @Column(nullable = false, name = "merchant_id")
    var merchantId: Long? = null,

    var quantity: Int? = null,

    var price: BigDecimal? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        orderId: Long? = this.orderId,
        productId: Long? = this.productId,
        merchantId: Long? = this.merchantId,
        quantity: Int? = this.quantity,
        price: BigDecimal? = this.price
    ): OrderItem {
        val copied = OrderItem(
            orderId = orderId,
            productId = productId,
            merchantId = merchantId,
            quantity = quantity,
            price = price
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    companion object {
        /**
         * OrderItem 생성 팩토리 메서드
         *
         * @param orderId 주문 ID (nullable, 나중에 설정됨)
         * @param productId 상품 ID
         * @param merchantId 판매자 ID (Product에서 비정규화)
         * @param quantity 수량
         * @param price 가격
         * @return 생성된 OrderItem
         */
        fun create(
            orderId: Long?,
            productId: Long,
            merchantId: Long,
            quantity: Int,
            price: BigDecimal
        ): OrderItem {
            return OrderItem(
                orderId = orderId,
                productId = productId,
                merchantId = merchantId,
                quantity = quantity,
                price = price
            )
        }
    }
}
