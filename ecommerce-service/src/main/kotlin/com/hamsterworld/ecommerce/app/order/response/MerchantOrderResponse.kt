package com.hamsterworld.ecommerce.app.order.response

import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import com.hamsterworld.ecommerce.domain.order.model.Order
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 머천트용 주문 목록 응답 DTO
 *
 * 머천트가 자신의 상품이 포함된 주문을 조회할 때 사용
 * - 전체 주문 정보를 반환하되, 자신의 상품만 필터링된 아이템 정보 포함
 */
data class MerchantOrderResponse(
    val orderPublicId: String,            // Order Public ID
    val userPublicId: String,             // User Public ID (구매자)
    val orderNumber: String,              // 주문 번호
    val gatewayPaymentPublicId: String?,  // 결제 Public ID
    val orderTotalPrice: BigDecimal,      // 전체 주문 금액
    val myItemsPrice: BigDecimal,         // 내 상품 금액 합계
    val myItemCount: Int,                 // 내 상품 수량
    val status: OrderStatus,              // 주문 상태
    val createdAt: LocalDateTime?,        // 주문 일시
    val modifiedAt: LocalDateTime?        // 수정 일시
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
