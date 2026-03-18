package com.hamsterworld.ecommerce.app.order.response
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime
data class MerchantOrderResponse(
    val orderPublicId: String,
    val userPublicId: String,
    val orderNumber: String,
    val gatewayPaymentPublicId: String?,
    val orderTotalPrice: BigDecimal,
    val myItemsPrice: BigDecimal,
    val myItemCount: Int,
    val status: OrderStatus,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(
            order: Order,
            userPublicId: String,
            myItemsPrice: BigDecimal,
            myItemCount: Int
        ): MerchantOrderResponse {
            return MerchantOrderResponse(
                orderPublicId = order.publicId,
                userPublicId = userPublicId,
                orderNumber = order.orderNumber ?: "",
                gatewayPaymentPublicId = order.gatewayPaymentPublicId,
                orderTotalPrice = order.price ?: BigDecimal.ZERO,
                myItemsPrice = myItemsPrice,
                myItemCount = myItemCount,
                status = order.status,
                createdAt = order.createdAt,
                modifiedAt = order.modifiedAt
            )
        }
    }
}
