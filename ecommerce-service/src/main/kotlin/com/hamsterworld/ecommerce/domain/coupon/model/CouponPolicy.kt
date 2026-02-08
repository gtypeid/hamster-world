package com.hamsterworld.ecommerce.domain.coupon.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.coupon.condition.CouponUsageConditionFilter
import com.hamsterworld.ecommerce.domain.coupon.condition.DiscountConditionEmitter
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponStatus
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * Coupon Policy
 *
 * 쿠폰 정책 (엔티티)
 *
 * ## 특징
 * - 플랫폼 쿠폰: Hamster World 발급 (모든 판매자 상품에 사용 가능)
 * - 판매자 쿠폰: 특정 Merchant가 발급 (해당 판매자 상품에만 사용 가능)
 * - 사용 조건: CouponUsageConditionFilter (@Embeddable)
 * - 할인 계산: DiscountConditionEmitter (@Embeddable)
 *
 * ## 사용 제약
 * - 1유저 1쿠폰 1회 사용
 * - CouponUsage 테이블에 UNIQUE(userId, couponCode) 제약
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE coupon_policies (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,
 *     coupon_code VARCHAR(50) NOT NULL UNIQUE,
 *     name VARCHAR(200) NOT NULL,
 *     description TEXT,
 *     issuer_type VARCHAR(50) NOT NULL,
 *     merchant_id BIGINT,
 *     status VARCHAR(50) NOT NULL,
 *     valid_from TIMESTAMP NOT NULL,
 *     valid_until TIMESTAMP NOT NULL,
 *     -- Embedded: CouponUsageConditionFilter
 *     min_order_amount DECIMAL(15,2),
 *     condition_filters TEXT,
 *     -- Embedded: DiscountConditionEmitter
 *     discount_type VARCHAR(50) NOT NULL,
 *     discount_value DECIMAL(15,2) NOT NULL,
 *     max_discount_amount DECIMAL(15,2),
 *     -- AbsDomain
 *     created_at TIMESTAMP NOT NULL,
 *     modified_at TIMESTAMP
 * );
 * ```
 */
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
    /**
     * 쿠폰 코드 (사용자가 입력하는 코드, 예: SPRING2025)
     */
    @Column(name = "coupon_code", nullable = false, unique = true, length = 50)
    var couponCode: String = "",

    /**
     * 쿠폰 이름 (예: "봄맞이 10% 할인")
     */
    @Column(nullable = false, length = 200)
    var name: String = "",

    /**
     * 설명
     */
    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    /**
     * 발급 주체 (PLATFORM, MERCHANT)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "issuer_type", nullable = false, length = 50)
    var issuerType: CouponIssuerType = CouponIssuerType.PLATFORM,

    /**
     * 판매자 ID (MERCHANT 쿠폰일 때만 사용, nullable)
     */
    @Column(name = "merchant_id", nullable = true)
    var merchantId: Long? = null,

    /**
     * 쿠폰 상태 (ACTIVE, INACTIVE, EXPIRED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: CouponStatus = CouponStatus.ACTIVE,

    /**
     * 유효 시작 시간
     */
    @Column(name = "valid_from", nullable = false)
    var validFrom: LocalDateTime = LocalDateTime.now(),

    /**
     * 유효 종료 시간
     */
    @Column(name = "valid_until", nullable = false)
    var validUntil: LocalDateTime = LocalDateTime.now().plusDays(30),

    /**
     * 사용 조건 (Embeddable)
     */
    @Embedded
    var usageCondition: CouponUsageConditionFilter = CouponUsageConditionFilter(),

    /**
     * 할인 계산 (Embeddable)
     */
    @Embedded
    var discountEmitter: DiscountConditionEmitter = DiscountConditionEmitter()
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        couponCode: String = this.couponCode,
        name: String = this.name,
        description: String? = this.description,
        issuerType: CouponIssuerType = this.issuerType,
        merchantId: Long? = this.merchantId,
        status: CouponStatus = this.status,
        validFrom: LocalDateTime = this.validFrom,
        validUntil: LocalDateTime = this.validUntil,
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
            usageCondition = usageCondition,
            discountEmitter = discountEmitter
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    /**
     * 쿠폰이 현재 사용 가능한지 확인
     */
    fun isUsable(now: LocalDateTime = LocalDateTime.now()): Boolean {
        // 1. 상태 체크
        if (status != CouponStatus.ACTIVE) {
            return false
        }

        // 2. 유효 기간 체크
        if (now !in validFrom..validUntil) {
            return false
        }

        return true
    }

    /**
     * 쿠폰 비활성화
     */
    fun deactivate(): CouponPolicy {
        return this.copy(status = CouponStatus.INACTIVE)
    }

    /**
     * 쿠폰 활성화
     */
    fun activate(): CouponPolicy {
        return this.copy(status = CouponStatus.ACTIVE)
    }

    /**
     * 쿠폰 만료 처리
     */
    fun expire(): CouponPolicy {
        return this.copy(status = CouponStatus.EXPIRED)
    }

    companion object {
        /**
         * CouponPolicy 생성 팩토리 메서드
         *
         * DDD 패턴: 도메인 생성 로직을 Domain 레이어에 위치
         *
         * @param issuerType 발급 주체 (PLATFORM, MERCHANT)
         * @param merchantId 판매자 ID (MERCHANT 쿠폰일 때만)
         * @param name 쿠폰 이름
         * @param description 설명
         * @param validFrom 유효 시작 시간
         * @param validUntil 유효 종료 시간
         * @param usageCondition 사용 조건
         * @param discountEmitter 할인 계산 로직
         * @return 생성된 CouponPolicy
         */
        fun create(
            issuerType: CouponIssuerType,
            merchantId: Long?,
            name: String,
            description: String?,
            validFrom: LocalDateTime,
            validUntil: LocalDateTime,
            usageCondition: CouponUsageConditionFilter,
            discountEmitter: DiscountConditionEmitter
        ): CouponPolicy {
            // 쿠폰 코드 자동 생성 (Domain 책임)
            val couponCode = generateCouponCode()

            return CouponPolicy(
                couponCode = couponCode,
                name = name,
                description = description,
                issuerType = issuerType,
                merchantId = merchantId,
                status = CouponStatus.ACTIVE,
                validFrom = validFrom,
                validUntil = validUntil,
                usageCondition = usageCondition,
                discountEmitter = discountEmitter
            )
        }

        /**
         * 쿠폰 코드 자동 생성
         *
         * 형식: CPN_{TIMESTAMP}_{RANDOM}
         * 예시: CPN_20260208123045_A1B2C3D4
         *
         * @return 생성된 쿠폰 코드
         */
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
