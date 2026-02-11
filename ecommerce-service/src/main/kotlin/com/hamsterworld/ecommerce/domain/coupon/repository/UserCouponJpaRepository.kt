package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

/**
 * User Coupon JPA Repository
 *
 * 간단한 JPA 쿼리 메서드
 */
interface UserCouponJpaRepository : JpaRepository<UserCoupon, Long> {
    /**
     * 사용자 + 쿠폰 정책 ID로 조회 (중복 수령 체크)
     */
    fun findByUserIdAndCouponPolicyId(userId: Long, couponPolicyId: Long): UserCoupon?

    /**
     * 사용자 + 쿠폰 코드로 조회
     */
    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): UserCoupon?

    /**
     * 사용자의 쿠폰 목록 조회 (상태 필터)
     */
    fun findByUserIdAndStatus(userId: Long, status: UserCouponStatus): List<UserCoupon>

    /**
     * 사용자의 전체 쿠폰 목록 조회
     */
    fun findByUserId(userId: Long): List<UserCoupon>

    /**
     * 만료 대상 쿠폰 조회 (AVAILABLE 상태이면서 expiresAt이 지난 쿠폰)
     */
    fun findByStatusAndExpiresAtBefore(status: UserCouponStatus, expiresAt: LocalDateTime): List<UserCoupon>
}
