package com.hamsterworld.ecommerce.domain.order.converter

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.cart.dto.CartOrderInput
import com.hamsterworld.ecommerce.domain.coupon.condition.CouponValidationInput
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponUsageRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.UserCouponRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

/**
 * Cart → Order 쿠폰 검증
 *
 * 주문 생성 시 UserCoupon Public ID가 제공되면 사용 가능 여부를 검증합니다.
 *
 * ## 검증 항목
 * 1. UserCoupon 존재 + 본인 소유 확인
 * 2. UserCoupon AVAILABLE 상태 + 만료 전
 * 3. CouponPolicy ACTIVE 상태 + 유효 기간
 * 4. 중복 사용 체크 (CouponUsage 존재 여부)
 * 5. 사용 조건 검증 (최소주문금액, 카테고리, 상품, 판매자)
 */
@Component
class CartToOrderCouponValidator(
    private val couponPolicyRepository: CouponPolicyRepository,
    private val userCouponRepository: UserCouponRepository,
    private val couponUsageRepository: CouponUsageRepository
) {

    private val log = LoggerFactory.getLogger(CartToOrderCouponValidator::class.java)

    /**
     * 쿠폰 검증
     *
     * userCouponPublicId가 null이면 검증을 건너뜁니다.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun validate(input: CartOrderInput) {
        val userCouponPublicId = input.userCouponPublicId ?: return
        val userId = input.cart.userId

        log.info("[쿠폰 검증] userId={}, userCouponPublicId={}", userId, userCouponPublicId)

        // 1. UserCoupon 조회 (Public ID 기반)
        val userCoupon = userCouponRepository.findByPublicId(userCouponPublicId)

        // 2. 본인 소유 확인
        if (userCoupon.userId != userId) {
            throw CustomRuntimeException("본인의 쿠폰만 사용할 수 있습니다")
        }

        // 3. UserCoupon 사용 가능 상태 확인 (AVAILABLE + 만료 전)
        if (!userCoupon.isUsable()) {
            throw CustomRuntimeException(
                "사용할 수 없는 쿠폰입니다. status=${userCoupon.status}, expiresAt=${userCoupon.expiresAt}"
            )
        }

        // 4. CouponPolicy 유효성 확인 (ACTIVE + 기간)
        val couponPolicy = couponPolicyRepository.findById(userCoupon.couponPolicyId)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("쿠폰 정책이 더 이상 유효하지 않습니다. 상태: ${couponPolicy.status}")
        }

        // 5. 중복 사용 체크 (CouponUsage 레벨)
        if (couponUsageRepository.existsByUserIdAndCouponCode(userId, userCoupon.couponCode)) {
            throw CustomRuntimeException("이미 사용한 쿠폰입니다: ${userCoupon.couponCode}")
        }

        // 6. 사용 조건 검증 (최소주문금액, 카테고리, 상품, 판매자)
        val totalPrice = input.items
            .map { it.product.price.multiply(BigDecimal.valueOf(it.cartItem.quantity.toLong())) }
            .fold(BigDecimal.ZERO) { acc, price -> acc.add(price) }

        val products = input.items.map { it.product }
        val validationInput = CouponValidationInput(
            totalAmount = totalPrice,
            productIds = products.map { it.id!! }.toSet(),
            merchantIds = products.map { it.merchantId }.toSet(),
            categories = products.map { it.category }.toSet()
        )
        if (!couponPolicy.usageCondition.matches(validationInput)) {
            throw CustomRuntimeException("쿠폰 사용 조건을 만족하지 않습니다")
        }

        log.info(
            "[쿠폰 검증 통과] userId={}, userCouponPublicId={}, couponCode={}",
            userId, userCouponPublicId, userCoupon.couponCode
        )
    }
}
