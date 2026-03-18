package com.hamsterworld.ecommerce.app.order.response
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime
data class MerchantOrderDetailResponse(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val gatewayPaymentPublicId: String?,
    val orderTotalPrice: BigDecimal,
    val myItemsPrice: BigDecimal,
    val status: OrderStatus,
    val myItems: List<OrderItemResponse>,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(
            order: Order,
            userPublicId: String,
            myItems: List<OrderItemResponse>
        ): MerchantOrderDetailResponse {
            val myItemsPrice = myItems.sumOf { it.price }
            return MerchantOrderDetailResponse(
                orderPublicId = order.publicId,
                userPublicId = userPublicId,
                orderNumber = order.orderNumber ?: "",
                gatewayPaymentPublicId = order.gatewayPaymentPublicId,
                orderTotalPrice = order.price ?: BigDecimal.ZERO,
                myItemsPrice = myItemsPrice,
                status = order.status,
                myItems = myItems,
                createdAt = order.createdAt,
                modifiedAt = order.modifiedAt
            )
        }
    }
}
