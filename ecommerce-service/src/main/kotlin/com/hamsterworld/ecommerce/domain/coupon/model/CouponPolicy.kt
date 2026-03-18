package com.hamsterworld.ecommerce.domain.coupon.model
import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.coupon.condition.CouponUsageConditionFilter
import com.hamsterworld.ecommerce.domain.coupon.condition.DiscountConditionEmitter
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponStatus
import com.hamsterworld.ecommerce.domain.coupon.event.InternalCouponPolicyCreatedEvent
import jakarta.persistence.*
import java.time.LocalDateTime
@Entity
@Table(
    name = "coupon_policies",
    indexes = [
        Index(name = "idx_coupon_policy_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_coupon_policy_code", columnList = "coupon_code", unique = true),
        Index(name = "idx_coupon_policy_merchant_id", columnList = "merchant_id"),
        Index(name = "idx_coupon_policy_status", columnList = "status")
    ]
)
class CouponPolicy(
    @Column(name = "coupon_code", nullable = false, unique = true, length = 50)
    var couponCode: String = "",
    @Column(nullable = false, length = 200)
    var name: String = "",
    @Column(columnDefinition = "TEXT")
    var description: String? = null,
    @Enumerated(EnumType.STRING)
    @Column(name = "issuer_type", nullable = false, length = 50)
    var issuerType: CouponIssuerType = CouponIssuerType.PLATFORM,
    @Column(name = "merchant_id", nullable = true)
    var merchantId: Long? = null,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: CouponStatus = CouponStatus.ACTIVE,
    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDateTime = LocalDateTime.now(),
    @Column(name = "valid_until", nullable = false)
    var validUntil: LocalDateTime = LocalDateTime.now().plusDays(30),
    @Column(name = "coupon_days", nullable = false)
    var couponDays: Int = 10,
    @Embedded
    var usageCondition: CouponUsageConditionFilter = CouponUsageConditionFilter(),
    @Embedded
    var discountEmitter: DiscountConditionEmitter = DiscountConditionEmitter()
) : AbsDomain() {
    @Suppress("SENSELESS_COMPARISON")
    @jakarta.persistence.PostLoad
    fun onPostLoad() {
        if (usageCondition == null) {
            usageCondition = CouponUsageConditionFilter()
        }
        if (discountEmitter == null) {
            discountEmitter = DiscountConditionEmitter()
        }
    }
    fun copy(
        couponCode: String = this.couponCode,
        name: String = this.name,
        description: String? = this.description,
        issuerType: CouponIssuerType = this.issuerType,
        merchantId: Long? = this.merchantId,
        status: CouponStatus = this.status,
        validFrom: LocalDateTime = this.validFrom,
        validUntil: LocalDateTime = this.validUntil,
        couponDays: Int = this.couponDays,
        usageCondition: CouponUsageConditionFilter = this.usageCondition,
        discountEmitter: DiscountConditionEmitter = this.discountEmitter
    ): CouponPolicy {
        val copied = CouponPolicy(
            couponCode = couponCode,
            name = name,
            description = description,
            issuerType = issuerType,
            merchantId = merchantId,
            status = status,
            validFrom = validFrom,
            validUntil = validUntil,
            couponDays = couponDays,
            usageCondition = usageCondition,
            discountEmitter = discountEmitter
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
    fun isUsable(now: LocalDateTime = LocalDateTime.now()): Boolean {
        if (status != CouponStatus.ACTIVE) {
            return false
        }
        if (now !in validFrom..validUntil) {
            return false
        }
        return true
    }
    fun deactivate(): CouponPolicy {
        return this.copy(status = CouponStatus.INACTIVE)
    }
    fun activate(): CouponPolicy {
        return this.copy(status = CouponStatus.ACTIVE)
    }
    fun expire(): CouponPolicy {
        return this.copy(status = CouponStatus.EXPIRED)
    }
    companion object {
        fun create(
            issuerType: CouponIssuerType,
            merchantId: Long?,
            name: String,
            description: String?,
            validFrom: LocalDateTime,
            validUntil: LocalDateTime,
            couponDays: Int = 10,
            usageCondition: CouponUsageConditionFilter,
            discountEmitter: DiscountConditionEmitter
        ): CouponPolicy {
            val couponCode = generateCouponCode()
            val policy = CouponPolicy(
                couponCode = couponCode,
                name = name,
                description = description,
                issuerType = issuerType,
                merchantId = merchantId,
                status = CouponStatus.ACTIVE,
                validFrom = validFrom,
                validUntil = validUntil,
                couponDays = couponDays,
                usageCondition = usageCondition,
                discountEmitter = discountEmitter
            )
            policy.registerEvent(InternalCouponPolicyCreatedEvent(couponPolicy = policy))
            return policy
        }
        private fun generateCouponCode(): String {
            val timestamp = LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
            val random = java.util.UUID.randomUUID().toString()
                .substring(0, 8)
                .uppercase()
            return "CPN_${timestamp}_${random}"
        }
    }
}
