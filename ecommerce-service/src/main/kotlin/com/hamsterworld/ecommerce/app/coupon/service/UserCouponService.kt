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

// Note: markUsed() 메서드는 제거됨
// 쿠폰 사용(USED 전환)은 주문 생성 파이프라인 내에서만 수행됨
// see: CartToOrderConverter → OrderRepository.saveOrderRecord()

/**
 * User Coupon Service
 *
 * 사용자 쿠폰 발급(수령), 조회, 만료 처리 비즈니스 로직
 *
 * ## 플로우
 * 1. 사용자가 쿠폰 코드로 수령 (claim) → UserCoupon 생성 (AVAILABLE)
 * 2. 사용자가 주문 시 쿠폰 적용 → Cart→Order 파이프라인 (Converter/Validator) → UserCoupon 상태 USED
 * 3. 배치/스케줄러로 만료 처리 → AVAILABLE + expiresAt 초과 → EXPIRED
 */
@Service
class UserCouponService(
    private val userCouponRepository: UserCouponRepository,
    private val couponPolicyRepository: CouponPolicyRepository,
    private val couponPolicyProductRepository: CouponPolicyProductRepository
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 쿠폰 수령 (Claim)
     *
     * @param userId 사용자 ID
     * @param couponCode 쿠폰 코드
     * @return UserCouponDto
     */
    @Transactional
    fun claimCoupon(userId: Long, couponCode: String): UserCouponDto {
        // 1. 쿠폰 정책 조회
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)

        // 2. 쿠폰 정책 유효성 확인 (ACTIVE + 발급 기간 내)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("현재 수령할 수 없는 쿠폰입니다. 상태: ${couponPolicy.status}")
        }

        // 3. 중복 수령 체크
        if (userCouponRepository.existsByUserIdAndCouponPolicyId(userId, couponPolicy.id!!)) {
            throw CustomRuntimeException("이미 수령한 쿠폰입니다: $couponCode")
        }

        // 4. UserCoupon 생성 (DDD 팩토리 메서드)
        val userCoupon = UserCoupon.create(
            userId = userId,
            couponPolicy = couponPolicy
        )

        // 5. 저장
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

    /**
     * 내 쿠폰 목록 조회 (SearchRequest 기반)
     *
     * 상품 필터 → eligible couponPolicyIds 변환은 Repository에서 처리
     */
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

    /**
     * 내 쿠폰 페이지 조회 (SearchRequest 기반)
     */
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

    // markUsed()는 단독 호출 불가 — 주문(Cart→Order) 파이프라인 내에서만 처리됨
    // CartToOrderConverter → OrderRepository.saveOrderRecord() 에서 CouponUsage 생성 + UserCoupon USED 전환

    /**
     * 만료 처리 (배치/스케줄러에서 호출)
     *
     * AVAILABLE 상태이면서 expiresAt이 지난 쿠폰을 일괄 EXPIRED 처리
     *
     * @return 만료 처리된 쿠폰 수
     */
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

    /**
     * UserCoupon 목록 → UserCouponDto 목록 변환 (쿠폰 정책 일괄 조회 포함)
     */
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

    /**
     * 쿠폰 정책 일괄 조회 (N+1 방지)
     */
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
