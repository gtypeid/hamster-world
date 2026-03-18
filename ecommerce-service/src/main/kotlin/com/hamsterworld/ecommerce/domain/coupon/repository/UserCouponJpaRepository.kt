package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime
interface UserCouponJpaRepository : JpaRepository<UserCoupon, Long> {
    fun findByUserIdAndCouponPolicyId(userId: Long, couponPolicyId: Long): UserCoupon?
    fun findByUserIdAndCouponCode(userId: Long, couponCode: String): UserCoupon?
    fun findByUserIdAndStatus(userId: Long, status: UserCouponStatus): List<UserCoupon>
    fun findByUserId(userId: Long): List<UserCoupon>
    fun findByStatusAndExpiresAtBefore(status: UserCouponStatus, expiresAt: LocalDateTime): List<UserCoupon>
}
