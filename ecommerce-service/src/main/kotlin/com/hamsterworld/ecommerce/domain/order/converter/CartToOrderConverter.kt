package com.hamsterworld.ecommerce.domain.order.converter

import com.hamsterworld.ecommerce.app.cart.dto.CartOrderInput
import com.hamsterworld.ecommerce.app.order.dto.CouponApplyResult
import com.hamsterworld.ecommerce.app.order.dto.OrderWithItems
import com.hamsterworld.common.domain.converter.DomainConverter
import com.hamsterworld.common.domain.converter.DomainConverterValidator
import com.hamsterworld.ecommerce.domain.coupon.repository.CouponPolicyRepository
import com.hamsterworld.ecommerce.domain.coupon.repository.UserCouponRepository
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

/**
 * Cart → Order Converter
 *
 * 장바구니를 주문으로 변환합니다.
 * 검증은 모두 Validator(CartToOrderValidator + CartToOrderCouponValidator)에서 완료된 상태.
 * Converter는 순수 변환(금액 계산, 할인 적용, 엔티티 생성)만 담당합니다.
 *
 * ## 쿠폰 처리
 * - Validator에서 검증 완료 (존재, 소유, 상태, 조건 매칭)
 * - Converter에서 할인 금액 계산 (discountEmitter.emit) + CouponApplyResult 생성
 * - OrderRepository.saveOrderRecord()에서 CouponUsage 생성 + UserCoupon USED 전환
 *
 * ## 향후 확장
 * - 포인트 차감: CartOrderInput에 usePoints 추가 → 여기서 finalPrice 반영
 */
@Component
class CartToOrderConverter(
    private val validator: DomainConverterValidator<CartOrderInput>,
    private val couponPolicyRepository: CouponPolicyRepository,
    private val userCouponRepository: UserCouponRepository
) : DomainConverter<CartOrderInput, OrderWithItems> {

    private val log = LoggerFactory.getLogger(CartToOrderConverter::class.java)

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == CartOrderInput::class.java && targetType == OrderWithItems::class.java
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun convert(source: CartOrderInput): OrderWithItems {
        validator.validate(source)

        // 1. 총 금액 계산 (할인 전)
        val totalPrice = source.items
            .map { item ->
                item.product.price.multiply(BigDecimal.valueOf(item.cartItem.quantity.toLong()))
            }
            .fold(BigDecimal.ZERO) { acc, price -> acc.add(price) }

        // 2. 쿠폰 할인 계산 (검증은 Validator에서 완료)
        val couponApply: CouponApplyResult? = source.userCouponPublicId?.let { userCouponPublicId ->
            calculateCouponDiscount(userCouponPublicId, totalPrice, source.cart.userId)
        }

        // 3. DDD 팩토리 메서드로 Order 생성 (할인 반영)
        val order = Order.create(
            userId = source.cart.userId,
            price = totalPrice,
            discountAmount = couponApply?.discountAmount,
            couponCode = couponApply?.couponCode
        )

        // 4. Order PK 파악 불가 → 하위에서 부착
        val orderItems = source.items.map { item ->
            OrderItem.create(
                orderId = null,
                productId = item.cartItem.productId,
                merchantId = item.product.merchantId,
                quantity = item.cartItem.quantity,
                price = item.product.price
            )
        }

        log.info(
            "[주문 변환] userId={}, totalPrice={}, discountAmount={}, finalPrice={}, couponCode={}, items={}개",
            source.cart.userId, totalPrice, couponApply?.discountAmount ?: 0, order.finalPrice,
            couponApply?.couponCode ?: "없음", orderItems.size
        )

        return OrderWithItems(
            order = order,
            items = orderItems,
            couponApply = couponApply
        )
    }

    /**
     * 쿠폰 할인 금액 계산 (순수 계산만)
     *
     * 검증은 CartToOrderCouponValidator에서 완료된 상태.
     * 여기서는 UserCoupon → CouponPolicy → discountEmitter.emit() 으로 할인 금액만 계산.
     */
    private fun calculateCouponDiscount(
        userCouponPublicId: String,
        totalPrice: BigDecimal,
        userId: Long
    ): CouponApplyResult {
        val userCoupon = userCouponRepository.findByPublicId(userCouponPublicId)
        val couponPolicy = couponPolicyRepository.findById(userCoupon.couponPolicyId)

        // 할인 금액 계산 (Emitter)
        val discountAmount = couponPolicy.discountEmitter.emit(totalPrice)

        log.info(
            "[쿠폰 할인 계산] userCouponPublicId={}, couponCode={}, discountType={}, discountValue={}, discountAmount={}",
            userCouponPublicId, userCoupon.couponCode, couponPolicy.discountEmitter.discountType,
            couponPolicy.discountEmitter.discountValue, discountAmount
        )

        return CouponApplyResult(
            userId = userId,
            couponPolicyId = couponPolicy.id!!,
            couponCode = userCoupon.couponCode,
            discountAmount = discountAmount,
            userCouponId = userCoupon.id!!
        )
    }
}
