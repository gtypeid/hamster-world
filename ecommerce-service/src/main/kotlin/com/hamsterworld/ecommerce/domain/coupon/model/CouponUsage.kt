package com.hamsterworld.ecommerce.domain.coupon.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
import java.math.BigDecimal

/**
 * Coupon Usage
 *
 * 쿠폰 사용 기록 (엔티티)
 *
 * ## 멱등성 보장
 * - UNIQUE(user_id, coupon_code): 1유저 1쿠폰 1회 사용
 * - DB 레벨 제약으로 중복 사용 방지
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE coupon_usages (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,
 *     user_id BIGINT NOT NULL,
 *     coupon_policy_id BIGINT NOT NULL,
 *     coupon_code VARCHAR(50) NOT NULL,
 *     order_id BIGINT NOT NULL,
 *     order_public_id VARCHAR(20) NOT NULL,
 *     discount_amount DECIMAL(15,2) NOT NULL,
 *     -- AbsDomain
 *     created_at TIMESTAMP NOT NULL,
 *     modified_at TIMESTAMP,
 *     -- Indexes
 *     UNIQUE KEY uk_user_coupon (user_id, coupon_code),
 *     INDEX idx_coupon_usage_public_id (public_id),
 *     INDEX idx_coupon_usage_user_id (user_id),
 *     INDEX idx_coupon_usage_order_id (order_id)
 * );
 * ```
 */
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
    /**
     * 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    /**
     * 쿠폰 정책 ID (FK)
     */
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,

    /**
     * 쿠폰 코드 (중복 방지용)
     */
    @Column(name = "coupon_code", nullable = false, length = 50)
    var couponCode: String = "",

    /**
     * 주문 ID (FK)
     */
    @Column(name = "order_id", nullable = false)
    var orderId: Long = 0,

    /**
     * 주문 Public ID (Kafka 이벤트용)
     */
    @Column(name = "order_public_id", nullable = false, length = 20)
    var orderPublicId: String = "",

    /**
     * 실제 적용된 할인 금액
     */
    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    var discountAmount: BigDecimal = BigDecimal.ZERO
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
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
}
