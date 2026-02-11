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
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyProductRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponUsageRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.UserCouponRepository
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
    private val couponPolicyProductRepository: CouponPolicyProductRepository,
    private val couponUsageRepository: CouponUsageRepository,
    private val userCouponRepository: UserCouponRepository,
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
            couponDays = request.couponDays ?: 10,
            usageCondition = CouponUsageConditionFilter(
                minOrderAmount = request.minOrderAmount ?: BigDecimal.ZERO,
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
     * 판매자 쿠폰 목록 조회 (대상 상품 정보 포함)
     *
     * 배치 조회 패턴:
     * 1. 쿠폰 정책 목록 조회 (루트)
     * 2. 정책 ID IN 쿼리로 CouponPolicyProduct 일괄 조회
     * 3. 상품 ID IN 쿼리로 Product 일괄 조회
     * 4. groupBy로 조합
     */
    fun getMerchantCoupons(merchant: Merchant): List<CouponPolicyDto> {
        // 1. 쿠폰 정책 목록 (루트)
        val policies = couponPolicyRepository.searchCouponPolicies(
            issuerType = CouponIssuerType.MERCHANT,
            merchantId = merchant.id!!,
            status = null,
            from = null,
            to = null
        )

        if (policies.isEmpty()) return emptyList()

        // 2. 정책 ID 기반 CouponPolicyProduct 배치 조회
        val policyIds = policies.map { it.id!! }
        val policyProducts = couponPolicyProductRepository.findByCouponPolicyIds(policyIds)

        // 3. 상품 ID 기반 Product 배치 조회
        val productIds = policyProducts.map { it.productId }.distinct()
        val productMap = if (productIds.isNotEmpty()) {
            productJpaRepository.findAllById(productIds).associateBy { it.id!! }
        } else {
            emptyMap()
        }

        // 4. couponPolicyId → List<TargetProductInfo> 그룹화
        val targetProductsMap = policyProducts
            .groupBy { it.couponPolicyId }
            .mapValues { (_, cpps) ->
                cpps.mapNotNull { cpp ->
                    productMap[cpp.productId]?.let { product ->
                        CouponPolicyDto.TargetProductInfo(
                            productPublicId = product.publicId,
                            productName = product.name
                        )
                    }
                }
            }

        // 5. 조합
        return policies.map { policy ->
            CouponPolicyDto.from(
                couponPolicy = policy,
                merchantPublicId = merchant.publicId,
                targetProducts = targetProductsMap[policy.id] ?: emptyList()
            )
        }
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
     * [DEPRECATED] 쿠폰 적용 — 단독 호출 금지
     *
     * 쿠폰 적용은 이제 Cart→Order 파이프라인 내에서 처리됩니다.
     * - CartToOrderCouponValidator: 사전 검증
     * - CartToOrderConverter: 할인 계산 + CouponApplyResult 생성
     * - OrderRepository.saveOrderRecord(): CouponUsage 생성 + UserCoupon USED 전환
     *
     * 이 메서드는 하위 호환을 위해 유지되나, 신규 코드에서는 사용하지 마십시오.
     */
    @Deprecated("Cart→Order 파이프라인으로 이전됨. CartToOrderConverter 참조")
    @Transactional
    fun applyCouponInternal(userId: Long, couponCode: String, orderId: Long): BigDecimal {
        // 1. 쿠폰 정책 조회
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)

        // 2. 쿠폰 정책 유효성 확인 (ACTIVE + 기간)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("사용할 수 없는 쿠폰입니다. 상태: ${couponPolicy.status}")
        }

        // 3. UserCoupon 수령 여부 + 사용 가능 상태 확인
        val userCoupon = userCouponRepository.findByUserIdAndCouponCode(userId, couponCode)
            ?: throw CustomRuntimeException("수령하지 않은 쿠폰입니다. 먼저 쿠폰을 수령해주세요: $couponCode")

        if (!userCoupon.isUsable()) {
            throw CustomRuntimeException(
                "사용할 수 없는 쿠폰입니다. status=${userCoupon.status}, expiresAt=${userCoupon.expiresAt}"
            )
        }

        // 4. 중복 사용 체크 (CouponUsage 레벨)
        if (couponUsageRepository.existsByUserIdAndCouponCode(userId, couponCode)) {
            throw CustomRuntimeException("이미 사용한 쿠폰입니다: $couponCode")
        }

        // 5. 주문 조회
        val order = orderRepository.findById(orderId)

        // 6. 사용 조건 검증
        validateCouponUsage(couponPolicy, order, userId)

        // 7. 할인 금액 계산
        val discountAmount = calculateDiscount(couponPolicy, order)

        // 8. CouponUsage 저장 (DDD 팩토리 메서드)
        val couponUsage = CouponUsage.create(
            userId = userId,
            couponPolicyId = couponPolicy.id!!,
            couponCode = couponCode,
            orderId = orderId,
            orderPublicId = order.publicId,
            discountAmount = discountAmount
        )
        couponUsageRepository.save(couponUsage)

        // 9. UserCoupon 상태 → USED
        val used = userCoupon.markUsed()
        userCouponRepository.save(used)

        return discountAmount
    }
}
