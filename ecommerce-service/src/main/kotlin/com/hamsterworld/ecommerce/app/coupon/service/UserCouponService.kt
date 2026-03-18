package com.hamsterworld.ecommerce.app.coupon.service
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.coupon.dto.UserCouponDto
import com.hamsterworld.ecommerce.app.coupon.request.UserCouponSearchRequest
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import com.hamsterworld.ecommerce.domain.coupon.model.UserCoupon
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyProductRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.UserCouponRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
@Service
class UserCouponService(
    private val userCouponRepository: UserCouponRepository,
    private val couponPolicyRepository: CouponPolicyRepository,
    private val couponPolicyProductRepository: CouponPolicyProductRepository
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    @Transactional
    fun claimCoupon(userId: Long, couponCode: String): UserCouponDto {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("현재 수령할 수 없는 쿠폰입니다. 상태: ${couponPolicy.status}")
        }
        if (userCouponRepository.existsByUserIdAndCouponPolicyId(userId, couponPolicy.id!!)) {
            throw CustomRuntimeException("이미 수령한 쿠폰입니다: $couponCode")
        }
        val userCoupon = UserCoupon.create(
            userId = userId,
            couponPolicy = couponPolicy
        )
        val saved = userCouponRepository.save(userCoupon)
        logger.info(
            "쿠폰 수령 완료 | userId={} | couponCode={} | expiresAt={} | publicId={}",
            userId, couponCode, saved.expiresAt, saved.publicId
        )
        return UserCouponDto.from(
            userCoupon = saved,
            couponPolicyPublicId = couponPolicy.publicId,
            couponName = couponPolicy.name
        )
    }
    @Transactional(readOnly = true)
    fun searchMyCoupons(userId: Long, searchRequest: UserCouponSearchRequest): List<UserCouponDto> {
        val eligiblePolicyIds = couponPolicyProductRepository
            .resolveEligiblePolicyIds(searchRequest.productPublicIds)
        val userCoupons = userCouponRepository.searchUserCoupons(
            userId = userId,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            couponPolicyIds = eligiblePolicyIds,
            sort = searchRequest.sort
        )
        return toUserCouponDtos(userCoupons)
    }
    @Transactional(readOnly = true)
    fun searchMyCouponsPage(userId: Long, searchRequest: UserCouponSearchRequest): Page<UserCouponDto> {
        val eligiblePolicyIds = couponPolicyProductRepository
            .resolveEligiblePolicyIds(searchRequest.productPublicIds)
        val userCouponsPage = userCouponRepository.searchUserCouponsPage(
            userId = userId,
            status = searchRequest.status,
            from = searchRequest.from,
            to = searchRequest.to,
            couponPolicyIds = eligiblePolicyIds,
            sort = searchRequest.sort,
            page = searchRequest.page,
            size = searchRequest.size
        )
        val policyIds = userCouponsPage.content.map { it.couponPolicyId }.distinct()
        val policyMap = batchLoadPolicies(policyIds)
        return userCouponsPage.map { uc ->
            val policy = policyMap[uc.couponPolicyId]
            UserCouponDto.from(
                userCoupon = uc,
                couponPolicyPublicId = policy?.publicId,
                couponName = policy?.name
            )
        }
    }
    @Transactional
    fun expireOverdueCoupons(): Int {
        val now = LocalDateTime.now()
        val expiredCoupons = userCouponRepository.findExpiredCoupons(now)
        if (expiredCoupons.isEmpty()) {
            return 0
        }
        val updated = expiredCoupons.map { it.markExpired() }
        userCouponRepository.saveAll(updated)
        logger.info("만료 쿠폰 일괄 처리 완료 | count={}", updated.size)
        return updated.size
    }
    private fun toUserCouponDtos(userCoupons: List<UserCoupon>): List<UserCouponDto> {
        if (userCoupons.isEmpty()) return emptyList()
        val policyIds = userCoupons.map { it.couponPolicyId }.distinct()
        val policyMap = batchLoadPolicies(policyIds)
        return userCoupons.map { uc ->
            val policy = policyMap[uc.couponPolicyId]
            UserCouponDto.from(
                userCoupon = uc,
                couponPolicyPublicId = policy?.publicId,
                couponName = policy?.name
            )
        }
    }
    private fun batchLoadPolicies(policyIds: List<Long>): Map<Long, CouponPolicy?> {
        return policyIds.associateWith { id ->
            try {
                couponPolicyRepository.findById(id)
            } catch (e: Exception) {
                null
            }
        }
    }
}
