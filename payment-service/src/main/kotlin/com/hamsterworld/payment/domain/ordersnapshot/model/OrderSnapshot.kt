package com.hamsterworld.payment.domain.ordersnapshot.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.product.event.OrderStockReservedEvent
import com.hamsterworld.payment.domain.product.event.OrderItemDto as ProductEventOrderItemDto
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

@Entity
@Table(
    name = "product_order_snapshots",
    indexes = [
        Index(name = "idx_order_public_id", columnList = "order_public_id", unique = true),
        Index(name = "idx_order_number", columnList = "order_number")
    ]
)
class OrderSnapshot(
    @Column(name = "order_public_id", nullable = false, length = 20)
    var orderPublicId: String,

    @Column(name = "order_number", nullable = false)
    var orderNumber: String,

    @Column(name = "user_public_id", nullable = false, length = 20)
    var userPublicId: String,

    @Column(name = "user_keycloak_id", nullable = false, length = 100)
    var userKeycloakId: String,

    @Column(name = "total_price", nullable = false, precision = 15, scale = 3)
    var totalPrice: BigDecimal,

    @Column(name = "coupon_discount", nullable = false, precision = 15, scale = 3)
    var couponDiscount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "points_used", nullable = false, precision = 15, scale = 3)
    var pointsUsed: BigDecimal = BigDecimal.ZERO,

    @Column(name = "cash_amount", nullable = false, precision = 15, scale = 3)
    var cashAmount: BigDecimal = BigDecimal.ZERO
) : AbsDomain() {

    companion object {

        fun createCompleted(
            orderPublicId: String,
            orderNumber: String,
            userPublicId: String,
            userKeycloakId: String,
            totalPrice: BigDecimal,
            couponDiscount: BigDecimal,
            pointsUsed: BigDecimal,
            cashAmount: BigDecimal,
            items: List<OrderItemDto>
        ): OrderSnapshot {
            val snapshot = OrderSnapshot(
                orderPublicId = orderPublicId,
                orderNumber = orderNumber,
                userPublicId = userPublicId,
                userKeycloakId = userKeycloakId,
                totalPrice = totalPrice,
                couponDiscount = couponDiscount,
                pointsUsed = pointsUsed,
                cashAmount = cashAmount
            )

            snapshot.registerEvent(
                OrderStockReservedEvent(
                    orderPublicId = orderPublicId,
                    userPublicId = userPublicId,
                    userKeycloakId = userKeycloakId,
                    orderNumber = orderNumber,
                    totalPrice = totalPrice,
                    couponDiscount = couponDiscount,
                    pointsUsed = pointsUsed,
                    cashAmount = cashAmount,
                    items = items.map { item ->
                        ProductEventOrderItemDto(
                            productId = item.productPublicId,
                            merchantPublicId = item.merchantPublicId,
                            quantity = item.quantity,
                            price = item.price
                        )
                    }
                )
            )

            return snapshot
        }
    }
}
