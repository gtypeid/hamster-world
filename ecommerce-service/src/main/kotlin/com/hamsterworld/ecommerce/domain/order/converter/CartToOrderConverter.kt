package com.hamsterworld.ecommerce.domain.order.converter

import com.hamsterworld.ecommerce.app.cart.dto.CartWithItems
import com.hamsterworld.ecommerce.app.order.dto.OrderWithItems
import com.hamsterworld.common.domain.converter.DomainConverter
import com.hamsterworld.common.domain.converter.DomainConverterValidator
import com.hamsterworld.ecommerce.domain.order.model.Order
import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Component
class CartToOrderConverter(
    private val validator: DomainConverterValidator<CartWithItems>
) : DomainConverter<CartWithItems, OrderWithItems> {

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == CartWithItems::class.java && targetType == OrderWithItems::class.java
    }

    @Transactional(propagation = Propagation.MANDATORY)
    override fun convert(source: CartWithItems): OrderWithItems {
        validator.validate(source)

        // 총 금액 계산
        val totalPrice = source.items
            .map { item ->
                item.product.price.multiply(BigDecimal.valueOf(item.cartItem.quantity.toLong()))
            }
            .fold(BigDecimal.ZERO) { acc, price -> acc.add(price) }

        val order = Order(
            userId = source.cart.userId,
            orderNumber = generateOrderNumber(),
            price = totalPrice
        )

        // Order PK파악 불가 하위에서 부착 시킴
        val orderItems = source.items.map { item ->
            OrderItem(
                orderId = null,
                productId = item.cartItem.productId,
                productPublicId = item.product.publicId,  // Product의 Public ID 저장
                quantity = item.cartItem.quantity,
                price = item.product.price
            )
        }

        return OrderWithItems(
            order = order,
            items = orderItems
        )
    }

    private fun generateOrderNumber(): String {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
    }
}
