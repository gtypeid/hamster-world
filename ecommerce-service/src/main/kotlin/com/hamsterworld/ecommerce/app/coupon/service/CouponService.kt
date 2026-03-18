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
    @Transactional
    fun createCouponPolicy(
        issuerType: CouponIssuerType,
        merchant: Merchant?,
        request: CreateCouponPolicyRequest
    ): CouponPolicyDto {
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
        val savedCouponPolicy = couponPolicyRepository.save(couponPolicy)
        val merchantPublicId = merchant?.publicId
        return CouponPolicyDto.from(savedCouponPolicy, merchantPublicId)
    }
    fun getCouponPolicy(couponCode: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        val merchantPublicId = couponPolicy.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(couponPolicy, merchantPublicId)
    }
    fun getCouponPolicyByPublicId(publicId: String): CouponPolicyDto {
        val couponPolicy = couponPolicyRepository.findByPublicId(publicId)
        val merchantPublicId = couponPolicy.merchantId?.let {
            merchantRepository.findById(it).publicId
        }
        return CouponPolicyDto.from(couponPolicy, merchantPublicId)
    }
    fun getMerchantCoupons(merchant: Merchant): List<CouponPolicyDto> {
        val policies = couponPolicyRepository.searchCouponPolicies(
            issuerType = CouponIssuerType.MERCHANT,
            merchantId = merchant.id!!,
            status = null,
            from = null,
            to = null
        )
        if (policies.isEmpty()) return emptyList()
        val policyIds = policies.map { it.id!! }
        val policyProducts = couponPolicyProductRepository.findByCouponPolicyIds(policyIds)
        val productIds = policyProducts.map { it.productId }.distinct()
        val productMap = if (productIds.isNotEmpty()) {
            productJpaRepository.findAllById(productIds).associateBy { it.id!! }
        } else {
            emptyMap()
        }
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
        return policies.map { policy ->
            CouponPolicyDto.from(
                couponPolicy = policy,
                merchantPublicId = merchant.publicId,
                targetProducts = targetProductsMap[policy.id] ?: emptyList()
            )
        }
    }
    private fun validateCouponUsage(couponPolicy: CouponPolicy, order: Order, userId: Long) {
        if (order.userId != userId) {
            throw CustomRuntimeException("본인의 주문에만 쿠폰을 적용할 수 있습니다")
        }
        val orderItems = orderItemJpaRepository.findByOrderId(order.id!!)
        if (orderItems.isEmpty()) {
            throw CustomRuntimeException("주문 항목이 없습니다")
        }
        val productIds = orderItems.map { it.productId!! }
        val products = productJpaRepository.findAllById(productIds)
        val validationInput = CouponValidationInput(
            totalAmount = order.price!!,
            productIds = productIds.toSet(),
            merchantIds = products.map { it.merchantId }.toSet(),
            categories = products.map { it.category }.toSet()
        )
        if (!couponPolicy.usageCondition.matches(validationInput)) {
            throw CustomRuntimeException("쿠폰 사용 조건을 만족하지 않습니다")
        }
    }
    private fun calculateDiscount(couponPolicy: CouponPolicy, order: Order): BigDecimal {
        return couponPolicy.discountEmitter.emit(order.price!!)
    }
    fun getUserCouponUsages(userId: Long): List<CouponUsageDto> {
        val couponUsages = couponUsageRepository.searchUserCouponUsages(
            userId = userId,
            from = null,
            to = null
        )
        return couponUsages.map { CouponUsageDto.from(it) }
    }
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
    @Deprecated("Cart→Order 파이프라인으로 이전됨. CartToOrderConverter 참조")
    @Transactional
    fun applyCouponInternal(userId: Long, couponCode: String, orderId: Long): BigDecimal {
        val couponPolicy = couponPolicyRepository.findByCouponCodeOrThrow(couponCode)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("사용할 수 없는 쿠폰입니다. 상태: ${couponPolicy.status}")
        }
        val userCoupon = userCouponRepository.findByUserIdAndCouponCode(userId, couponCode)
            ?: throw CustomRuntimeException("수령하지 않은 쿠폰입니다. 먼저 쿠폰을 수령해주세요: $couponCode")
        if (!userCoupon.isUsable()) {
            throw CustomRuntimeException(
                "사용할 수 없는 쿠폰입니다. status=${userCoupon.status}, expiresAt=${userCoupon.expiresAt}"
            )
        }
        if (couponUsageRepository.existsByUserIdAndCouponCode(userId, couponCode)) {
            throw CustomRuntimeException("이미 사용한 쿠폰입니다: $couponCode")
        }
        val order = orderRepository.findById(orderId)
        validateCouponUsage(couponPolicy, order, userId)
        val discountAmount = calculateDiscount(couponPolicy, order)
        val couponUsage = CouponUsage.create(
            userId = userId,
            couponPolicyId = couponPolicy.id!!,
            couponCode = couponCode,
            orderId = orderId,
            orderPublicId = order.publicId,
            discountAmount = discountAmount
        )
        couponUsageRepository.save(couponUsage)
        val used = userCoupon.markUsed()
        userCouponRepository.save(used)
        return discountAmount
    }
}
