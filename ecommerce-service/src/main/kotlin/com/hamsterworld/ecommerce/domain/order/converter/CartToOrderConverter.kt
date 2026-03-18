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
        val totalPrice = source.items
            .map { item ->
                item.product.price.multiply(BigDecimal.valueOf(item.cartItem.quantity.toLong()))
            }
            .fold(BigDecimal.ZERO) { acc, price -> acc.add(price) }
        val couponApply: CouponApplyResult? = source.userCouponPublicId?.let { userCouponPublicId ->
            calculateCouponDiscount(userCouponPublicId, totalPrice, source.cart.userId)
        }
        val order = Order.create(
            userId = source.cart.userId,
            price = totalPrice,
            discountAmount = couponApply?.discountAmount,
            couponCode = couponApply?.couponCode
        )
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
    private fun calculateCouponDiscount(
        userCouponPublicId: String,
        totalPrice: BigDecimal,
        userId: Long
    ): CouponApplyResult {
        val userCoupon = userCouponRepository.findByPublicId(userCouponPublicId)
        val couponPolicy = couponPolicyRepository.findById(userCoupon.couponPolicyId)
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
