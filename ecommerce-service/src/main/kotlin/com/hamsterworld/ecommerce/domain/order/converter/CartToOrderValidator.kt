package com.hamsterworld.ecommerce.domain.order.converter
import com.hamsterworld.ecommerce.app.cart.dto.CartOrderInput
import com.hamsterworld.common.domain.converter.DomainConverterValidator
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
@Component
class CartToOrderValidator(
    private val couponValidator: CartToOrderCouponValidator
) : DomainConverterValidator<CartOrderInput> {
    private val log = LoggerFactory.getLogger(CartToOrderValidator::class.java)
    @Transactional(propagation = Propagation.MANDATORY)
    override fun validate(source: CartOrderInput) {
        if (source.items.isEmpty()) {
            throw CustomRuntimeException("장바구니에 상품이 없습니다.")
        }
        source.items.forEach { item ->
            val product = item.product
            val requestedQty = item.cartItem.quantity
            log.info(
                "[주문 검증] productId={}, 요청수량={}, 캐시 재고={}, 품절={}",
                product.id, requestedQty, product.stock, product.isSoldOut
            )
            if (product.isSoldOut) {
                log.warn("[주문 검증 경고] 상품 [{}]은 품절 상태입니다 (캐시 정보)", product.name)
            }
            if (product.stock < requestedQty) {
                log.warn(
                    "[주문 검증 경고] 상품 [{}] 재고 부족 가능성: 요청 {}개, 캐시 재고 {}개",
                    product.name, requestedQty, product.stock
                )
            }
        }
        couponValidator.validate(source)
    }
}
