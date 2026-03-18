package com.hamsterworld.ecommerce.app.order.response
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime
data class OrderDetailResponse(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val gatewayPaymentPublicId: String?,
    val totalPrice: BigDecimal,
    val status: OrderStatus,
    val items: List<OrderItemResponse>,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(
            order: Order,
            userPublicId: String,
            items: List<OrderItemResponse>
        ): OrderDetailResponse {
            return OrderDetailResponse(
                orderPublicId = order.publicId,
                userPublicId = userPublicId,
                orderNumber = order.orderNumber ?: "",
                gatewayPaymentPublicId = order.gatewayPaymentPublicId,
                totalPrice = order.price ?: BigDecimal.ZERO,
                status = order.status,
                items = items,
                createdAt = order.createdAt,
                modifiedAt = order.modifiedAt
            )
        }
    }
}
