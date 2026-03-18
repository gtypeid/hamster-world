package com.hamsterworld.ecommerce.app.order.response
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import com.hamsterworld.ecommerce.domain.product.model.Product
import java.math.BigDecimal
data class OrderItemResponse(
    val orderItemPublicId: String,
    val productPublicId: String,
    val productName: String,
    val productImageUrl: String?,
    val quantity: Int,
    val price: BigDecimal
) {
    companion object {
        fun from(orderItem: OrderItem, product: Product): OrderItemResponse {
            return OrderItemResponse(
                orderItemPublicId = orderItem.publicId,
                productPublicId = product.publicId,
                productName = product.name,
                productImageUrl = product.imageUrl,
                quantity = orderItem.quantity ?: 0,
                price = orderItem.price ?: BigDecimal.ZERO
            )
        }
    }
}
