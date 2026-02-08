package com.hamsterworld.ecommerce.app.coupon.service

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.coupon.dto.CouponPolicyDto
import com.hamsterworld.ecommerce.app.coupon.dto.CouponUsageDto
import com.hamsterworld.ecommerce.app.coupon.request.CreateCouponPolicyRequest
import com.hamsterworld.ecommerce.domain.coupon.condition.CouponUsageConditionFilter
import com.hamsterworld.ecommerce.domain.coupon.condition.CouponValidationInput
import com.hamsterworld.ecommerce.domain.coupon.condition.DiscountConditionEmitter
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponIssuerType
import com.hamsterworld.ecommerce.domain.coupon.constant.CouponStatus
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy
import com.hamsterworld.ecommerce.domain.coupon.model.CouponUsage
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponUsageRepository
import com.hamsterworld.ecommerce.domain.merchant.model.Merchant
import com.hamsterworld.ecommerce.domain.merchant.repository.MerchantRepository
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import com.hamsterworld.ecommerce.domain.orderitem.repository.OrderItemJpaRepository
import com.hamsterworld.ecommerce.domain.product.repository.ProductJpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

/**
 * Coupon Service
 *
 * 쿠폰 정책 관리 및 쿠폰 적용 비즈니스 로직
 */
@Service
class CouponService(
    private val couponPolicyRepository: CouponPolicyRepository,
    private val couponUsageRepository: CouponUsageRepository,
    private val merchantRepository: MerchantRepository,
    private val orderRepository: OrderRepository,
    private val orderItemJpaRepository: OrderItemJpaRepository,
    private val productJpaRepository: ProductJpaRepository
) {

    /**
     * 쿠폰 정책 생성
     *
     * @param issuerType PLATFORM 또는 MERCHANT
     * @param merchant MERCHANT 쿠폰일 때만 필수 (Merchant 엔티티 전체)
     * @param request 쿠폰 정책 생성 요청
     */
    @Transactional
    fun createCouponPolicy(
        issuerType: CouponIssuerType,
        merchant: Merchant?,
        request: CreateCouponPolicyRequest
    ): CouponPolicyDto {
        // 1. CouponPolicy 생성 (DDD 팩토리 메서드)
        val couponPolicy = CouponPolicy.create(
            issuerType = issuerType,
            merchantId = merchant?.id,
            name = request.name,
            description = request.description,
            validFrom = request.validFrom,
            validUntil = request.validUntil,
            usageCondition = CouponUsageConditionFilter(
                minOrderAmount = request.minOrderAmount,
                filtersJson = request.conditionFiltersJson
            ),
            discountEmitter = DiscountConditionEmitter(
                discountType = request.discountType,
                discountValue = request.discountValue,
                maxDiscountAmount = request.maxDiscountAmount
            )
        )

        // 2. 저장
        val savedCouponPolicy = couponPolicyRepository.save(couponPolicy)

        // 3. DTO 변환
        val merchantPublicId = merchant?.publicId
        return CouponPolicyDto.from(savedCouponPolicy, merchantPublicId)
    }

    /**
     * 쿠폰 정책 조회 (couponCode)
     */
    fun getCouponPolicy(couponCode: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        val merchantPublicId = couponPolicy.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(couponPolicy, merchantPublicId)
    }

    /**
     * 쿠폰 정책 조회 (publicId)
     */
    fun getCouponPolicyByPublicId(publicId: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByPublicId(publicId)
        val merchantPublicId = couponPolicy.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(couponPolicy, merchantPublicId)
    }

    /**
     * 판매자 쿠폰 목록 조회
     */
    fun getMerchantCoupons(merchant: Merchant): List<CouponPolicyDto> {
        val coupons = couponPolicyRepository.searchCouponPolicies(
            issuerType = CouponIssuerType.MERCHANT,
            merchantId = merchant.id!!,
            status = null,
            from = null,
            to = null
        )

        return coupons.map { CouponPolicyDto.from(it, merchant.publicId) }
    }

    /**
     * 쿠폰 사용 조건 검증 (Private)
     */
    private fun validateCouponUsage(couponPolicy: CouponPolicy, order: Order, userId: Long) {
        // 1. 주문 소유자 확인
        if (order.userId != userId) {
            throw CustomRuntimeException("본인의 주문에만 쿠폰을 적용할 수 있습니다")
        }

        // 2. OrderItem 조회
        val orderItems = orderItemJpaRepository.findByOrderId(order.id!!)
        if (orderItems.isEmpty()) {
            throw CustomRuntimeException("주문 항목이 없습니다")
        }

        // 3. Product 조회 (category, merchantId 확인)
        val productIds = orderItems.map { it.productId!! }
        val products = productJpaRepository.findAllById(productIds)

        // 4. CouponValidationInput 생성
        val validationInput = CouponValidationInput(
            totalAmount = order.price!!,
            productIds = productIds.toSet(),
            merchantIds = products.map { it.merchantId }.toSet(),
            categories = products.map { it.category }.toSet()
        )

        // 5. 조건 검증
        if (!couponPolicy.usageCondition.matches(validationInput)) {
            throw CustomRuntimeException("쿠폰 사용 조건을 만족하지 않습니다")
        }
    }

    /**
     * 할인 금액 계산
     */
    private fun calculateDiscount(couponPolicy: CouponPolicy, order: Order): BigDecimal {
        return couponPolicy.discountEmitter.emit(order.price!!)
    }

    /**
     * 사용자 쿠폰 사용 내역 조회
     */
    fun getUserCouponUsages(userId: Long): List<CouponUsageDto> {
        val couponUsages = couponUsageRepository.searchUserCouponUsages(
            userId = userId,
            from = null,
            to = null
        )

        return couponUsages.map { CouponUsageDto.from(it) }
    }

    /**
     * 쿠폰 정책 비활성화
     */
    @Transactional
    fun deactivateCouponPolicy(couponCode: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        val updated = couponPolicy.deactivate()
        val saved = couponPolicyRepository.save(updated)
        val merchantPublicId = saved.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(saved, merchantPublicId)
    }

    /**
     * 쿠폰 정책 활성화
     */
    @Transactional
    fun activateCouponPolicy(couponCode: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        val updated = couponPolicy.activate()
        val saved = couponPolicyRepository.save(updated)
        val merchantPublicId = saved.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(saved, merchantPublicId)
    }

    /**
     * 쿠폰 적용 (Internal - OrderService에서 호출)
     *
     * 주문 생성 시 쿠폰 코드가 제공되면 이 메서드를 호출하여 쿠폰을 적용합니다.
     *
     * @param userId 사용자 ID
     * @param couponCode 쿠폰 코드
     * @param orderId 주문 ID
     * @return 할인 금액
     */
    @Transactional
    fun applyCouponInternal(userId: Long, couponCode: String, orderId: Long): BigDecimal {
        // 1. 쿠폰 정책 조회
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)

        // 2. 쿠폰 사용 가능 여부 확인
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("사용할 수 없는 쿠폰입니다. 상태: ${couponPolicy.status}")
        }

        // 3. 중복 사용 체크
        if (couponUsageRepository.existsByUserIdAndCouponCode(userId, couponCode)) {
            throw CustomRuntimeException("이미 사용한 쿠폰입니다: $couponCode")
        }

        // 4. 주문 조회
        val order = orderRepository.findById(orderId)

        // 5. 사용 조건 검증
        validateCouponUsage(couponPolicy, order, userId)

        // 6. 할인 금액 계산
        val discountAmount = calculateDiscount(couponPolicy, order)

        // 7. CouponUsage 저장
        val couponUsage = CouponUsage(
            userId = userId,
            couponPolicyId = couponPolicy.id!!,
            couponCode = couponCode,
            orderId = orderId,
            orderPublicId = order.publicId,
            discountAmount = discountAmount
        )

        couponUsageRepository.save(couponUsage)

        return discountAmount
    }
}
