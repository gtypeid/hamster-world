package com.hamsterworld.ecommerce.app.order.response

import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 머천트용 주문 상세 응답 DTO
 *
 * 머천트가 특정 주문의 자신의 상품 상세 정보를 조회할 때 사용
 */
data class MerchantOrderDetailResponse(
    val orderPublicId: String,            // Order Public ID
    val userPublicId: String,             // User Public ID (구매자)
    val orderNumber: String,              // 주문 번호
    val gatewayPaymentPublicId: String?,  // 결제 Public ID
    val orderTotalPrice: BigDecimal,      // 전체 주문 금액
    val myItemsPrice: BigDecimal,         // 내 상품 금액 합계
    val status: OrderStatus,              // 주문 상태
    val myItems: List<OrderItemResponse>, // 내 상품 목록 (필터링됨)
    val createdAt: LocalDateTime?,        // 주문 일시
    val modifiedAt: LocalDateTime?        // 수정 일시
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
