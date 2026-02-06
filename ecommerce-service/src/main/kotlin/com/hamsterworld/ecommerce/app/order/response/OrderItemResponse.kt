package com.hamsterworld.ecommerce.app.order.response

import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import com.hamsterworld.ecommerce.domain.product.model.Product
import java.math.BigDecimal

/**
 * 주문 아이템 응답 DTO
 *
 * 주문 상세 조회 시 포함되는 상품 정보
 */
data class OrderItemResponse(
    val orderItemPublicId: String,   // OrderItem Public ID
    val productPublicId: String,     // Product Public ID
    val productName: String,         // 상품명
    val productImageUrl: String?,    // 상품 이미지
    val quantity: Int,               // 수량
    val price: BigDecimal            // 가격 (단가 * 수량)
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
