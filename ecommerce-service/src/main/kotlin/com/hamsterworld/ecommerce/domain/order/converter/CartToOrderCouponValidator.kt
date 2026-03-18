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
@Component
class CartToOrderCouponValidator(
    private val couponPolicyRepository: CouponPolicyRepository,
    private val userCouponRepository: UserCouponRepository,
    private val couponUsageRepository: CouponUsageRepository
) {
    private val log = LoggerFactory.getLogger(CartToOrderCouponValidator::class.java)
    @Transactional(propagation = Propagation.MANDATORY)
    fun validate(input: CartOrderInput) {
        val userCouponPublicId = input.userCouponPublicId ?: return
        val userId = input.cart.userId
        log.info("[쿠폰 검증] userId={}, userCouponPublicId={}", userId, userCouponPublicId)
        val userCoupon = userCouponRepository.findByPublicId(userCouponPublicId)
        if (userCoupon.userId != userId) {
            throw CustomRuntimeException("본인의 쿠폰만 사용할 수 있습니다")
        }
        if (!userCoupon.isUsable()) {
            throw CustomRuntimeException(
                "사용할 수 없는 쿠폰입니다. status=${userCoupon.status}, expiresAt=${userCoupon.expiresAt}"
            )
        }
        val couponPolicy = couponPolicyRepository.findById(userCoupon.couponPolicyId)
        if (!couponPolicy.isUsable()) {
            throw CustomRuntimeException("쿠폰 정책이 더 이상 유효하지 않습니다. 상태: ${couponPolicy.status}")
        }
        if (couponUsageRepository.existsByUserIdAndCouponCode(userId, userCoupon.couponCode)) {
            throw CustomRuntimeException("이미 사용한 쿠폰입니다: ${userCoupon.couponCode}")
        }
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
