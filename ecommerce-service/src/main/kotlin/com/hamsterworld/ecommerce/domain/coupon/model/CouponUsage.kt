package com.hamsterworld.ecommerce.domain.coupon.model
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
import java.math.BigDecimal
@Entity
@Table(
    name = "coupon_usages",
    indexes = [
        Index(name = "idx_coupon_usage_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_coupon_usage_user_id", columnList = "user_id"),
        Index(name = "idx_coupon_usage_order_id", columnList = "order_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_user_coupon",
            columnNames = ["user_id", "coupon_code"]
        )
    ]
)
class CouponUsage(
    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,
    @Column(name = "coupon_code", nullable = false, length = 50)
    var couponCode: String = "",
    @Column(name = "order_id", nullable = false)
    var orderId: Long = 0,
    @Column(name = "order_public_id", nullable = false, length = 20)
    var orderPublicId: String = "",
    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    var discountAmount: BigDecimal = BigDecimal.ZERO
) : AbsDomain() {
    fun copy(
        userId: Long = this.userId,
        couponPolicyId: Long = this.couponPolicyId,
        couponCode: String = this.couponCode,
        orderId: Long = this.orderId,
        orderPublicId: String = this.orderPublicId,
        discountAmount: BigDecimal = this.discountAmount
    ): CouponUsage {
        val copied = CouponUsage(
            userId = userId,
            couponPolicyId = couponPolicyId,
            couponCode = couponCode,
            orderId = orderId,
            orderPublicId = orderPublicId,
            discountAmount = discountAmount
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
    companion object {
        fun create(
            userId: Long,
            couponPolicyId: Long,
            couponCode: String,
            orderId: Long,
            orderPublicId: String,
            discountAmount: BigDecimal
        ): CouponUsage {
            return CouponUsage(
                userId = userId,
                couponPolicyId = couponPolicyId,
                couponCode = couponCode,
                orderId = orderId,
                orderPublicId = orderPublicId,
                discountAmount = discountAmount
            )
        }
    }
}
