package com.hamsterworld.ecommerce.domain.coupon.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * User Coupon
 *
 * 사용자 쿠폰 (발급/수령 기록)
 *
 * ## 역할
 * - CouponPolicy(템플릿)와 CouponUsage(사용 기록) 사이의 중간 단계
 * - 사용자가 쿠폰을 "수령"하면 UserCoupon이 생성됨
 * - 사용 시 status → USED, 기한 초과 시 status → EXPIRED
 *
 * ## 사용 기한 계산
 * - expiresAt = issuedAt + CouponPolicy.couponDays
 * - 예: couponDays=7, 2/20 수령 → expiresAt = 2/27
 *
 * ## 제약
 * - 1유저 1쿠폰정책 1수령: UNIQUE(user_id, coupon_policy_id)
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE user_coupons (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,
 *     user_id BIGINT NOT NULL,
 *     coupon_policy_id BIGINT NOT NULL,
 *     coupon_code VARCHAR(50) NOT NULL,
 *     status VARCHAR(50) NOT NULL,
 *     issued_at DATETIME NOT NULL,
 *     expires_at DATETIME NOT NULL,
 *     used_at DATETIME,
 *     -- AbsDomain
 *     created_at DATETIME NOT NULL,
 *     modified_at DATETIME,
 *     UNIQUE KEY uk_user_coupon_policy (user_id, coupon_policy_id)
 * );
 * ```
 */
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
    /**
     * 사용자 ID (Internal PK)
     */
    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    /**
     * 쿠폰 정책 ID (Internal PK FK)
     */
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,

    /**
     * 쿠폰 코드 (CouponPolicy.couponCode 복사, 조회 편의용)
     */
    @Column(name = "coupon_code", nullable = false, length = 50)
    var couponCode: String = "",

    /**
     * 사용자 쿠폰 상태 (AVAILABLE, USED, EXPIRED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: UserCouponStatus = UserCouponStatus.AVAILABLE,

    /**
     * 발급(수령) 시점
     */
    @Column(name = "issued_at", nullable = false)
    var issuedAt: LocalDateTime = LocalDateTime.now(),

    /**
     * 사용 만료 시점 (issuedAt + couponDays)
     */
    @Column(name = "expires_at", nullable = false)
    var expiresAt: LocalDateTime = LocalDateTime.now().plusDays(10),

    /**
     * 사용 시점 (사용 완료 시에만 설정)
     */
    @Column(name = "used_at", nullable = true)
    var usedAt: LocalDateTime? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
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

    /**
     * 쿠폰이 현재 사용 가능한지 확인
     */
    fun isUsable(now: LocalDateTime = LocalDateTime.now()): Boolean {
        if (status != UserCouponStatus.AVAILABLE) {
            return false
        }
        if (now.isAfter(expiresAt)) {
            return false
        }
        return true
    }

    /**
     * 쿠폰 사용 처리
     */
    fun markUsed(now: LocalDateTime = LocalDateTime.now()): UserCoupon {
        return this.copy(
            status = UserCouponStatus.USED,
            usedAt = now
        )
    }

    /**
     * 쿠폰 만료 처리
     */
    fun markExpired(): UserCoupon {
        return this.copy(status = UserCouponStatus.EXPIRED)
    }

    companion object {
        /**
         * UserCoupon 생성 팩토리 메서드
         *
         * DDD 패턴: 도메인 생성 로직을 Domain 레이어에 위치
         *
         * @param userId 사용자 ID
         * @param couponPolicy 쿠폰 정책
         * @return 생성된 UserCoupon
         */
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
