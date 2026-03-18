package com.hamsterworld.ecommerce.domain.coupon.model
import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import jakarta.persistence.*
import java.time.LocalDateTime
@Entity
@Table(
    name = "user_coupons",
    indexes = [
        Index(name = "idx_user_coupon_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_user_coupon_user_id", columnList = "user_id"),
        Index(name = "idx_user_coupon_status", columnList = "status"),
        Index(name = "idx_user_coupon_expires_at", columnList = "expires_at")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_user_coupon_policy",
            columnNames = ["user_id", "coupon_policy_id"]
        )
    ]
)
class UserCoupon(
    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,
    @Column(name = "coupon_code", nullable = false, length = 50)
    var couponCode: String = "",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: UserCouponStatus = UserCouponStatus.AVAILABLE,
    @Column(name = "issued_at", nullable = false)
    var issuedAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime = LocalDateTime.now().plusDays(10),
    @Column(name = "used_at", nullable = true)
    var usedAt: LocalDateTime? = null
) : AbsDomain() {
    fun copy(
        userId: Long = this.userId,
        couponPolicyId: Long = this.couponPolicyId,
        couponCode: String = this.couponCode,
        status: UserCouponStatus = this.status,
        issuedAt: LocalDateTime = this.issuedAt,
        expiresAt: LocalDateTime = this.expiresAt,
        usedAt: LocalDateTime? = this.usedAt
    ): UserCoupon {
        val copied = UserCoupon(
            userId = userId,
            couponPolicyId = couponPolicyId,
            couponCode = couponCode,
            status = status,
            issuedAt = issuedAt,
            expiresAt = expiresAt,
            usedAt = usedAt
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
    fun isUsable(now: LocalDateTime = LocalDateTime.now()): Boolean {
        if (status != UserCouponStatus.AVAILABLE) {
            return false
        }
        if (now.isAfter(expiresAt)) {
            return false
        }
        return true
    }
    fun markUsed(now: LocalDateTime = LocalDateTime.now()): UserCoupon {
        return this.copy(
            status = UserCouponStatus.USED,
            usedAt = now
        )
    }
    fun markExpired(): UserCoupon {
        return this.copy(status = UserCouponStatus.EXPIRED)
    }
    companion object {
        fun create(
            userId: Long,
            couponPolicy: CouponPolicy
        ): UserCoupon {
            val now = LocalDateTime.now()
            val expiresAt = now.plusDays(couponPolicy.couponDays.toLong())
            return UserCoupon(
                userId = userId,
                couponPolicyId = couponPolicy.id!!,
                couponCode = couponPolicy.couponCode,
                status = UserCouponStatus.AVAILABLE,
                issuedAt = now,
                expiresAt = expiresAt
            )
        }
    }
}
