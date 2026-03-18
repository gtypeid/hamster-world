package com.hamsterworld.ecommerce.app.order.dto
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
data class OrderWithItems(
    val order: Order,
    val items: List<OrderItem> = emptyList(),
    val couponApply: CouponApplyResult? = null
)
data class CouponApplyResult(
    val userId: Long,
    val couponPolicyId: Long,
    val couponCode: String,
    val discountAmount: java.math.BigDecimal,
    val userCouponId: Long
)
