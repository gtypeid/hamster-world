package com.hamsterworld.ecommerce.app.order.dto

import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem

data class OrderWithItems(
    val order: Order,
    val items: List<OrderItem> = emptyList(),
    /**
     * 쿠폰 적용 결과 (주문 저장 후 CouponUsage 생성 + UserCoupon USED 처리에 사용)
     * Converter에서 계산하여 설정, OrderRepository.saveOrderRecord()에서 소비
     */
    val couponApply: CouponApplyResult? = null
)

/**
 * 쿠폰 적용 결과 (Converter → Repository로 전달되는 중간 DTO)
 *
 * Converter에서 할인을 계산하고, 주문 저장 후 orderId가 확정되면
 * CouponUsage를 생성하고 UserCoupon을 USED로 전환하기 위한 정보
 */
data class CouponApplyResult(
    val userId: Long,
    val couponPolicyId: Long,
    val couponCode: String,
    val discountAmount: java.math.BigDecimal,
    val userCouponId: Long  // UserCoupon의 ID (USED 처리용)
)
