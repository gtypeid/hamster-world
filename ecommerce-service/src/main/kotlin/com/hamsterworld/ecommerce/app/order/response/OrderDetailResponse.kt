package com.hamsterworld.ecommerce.app.order.response

import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 주문 상세 응답 DTO
 *
 * 일반 사용자의 주문 상세 조회 시 사용
 */
data class OrderDetailResponse(
    val orderPublicId: String,            // Order Public ID
    val userPublicId: String,             // User Public ID
    val orderNumber: String,              // 주문 번호
    val gatewayPaymentPublicId: String?,  // 결제 Public ID
    val totalPrice: BigDecimal,           // 총 금액
    val status: OrderStatus,              // 주문 상태
    val items: List<OrderItemResponse>,   // 주문 아이템 목록
    val createdAt: LocalDateTime?,        // 주문 일시
    val modifiedAt: LocalDateTime?        // 수정 일시
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
