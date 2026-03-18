package com.hamsterworld.ecommerce.domain.coupon.condition
import com.hamsterworld.common.domain.condition.ConditionEmitter
import com.hamsterworld.ecommerce.domain.coupon.constant.DiscountType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.math.BigDecimal
import java.math.RoundingMode
@Embeddable
class DiscountConditionEmitter(
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 50)
    var discountType: DiscountType = DiscountType.FIXED,
    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    var discountValue: BigDecimal = BigDecimal.ZERO,
    @Column(name = "max_discount_amount", nullable = true, precision = 15, scale = 2)
    var maxDiscountAmount: BigDecimal? = null
) : ConditionEmitter<BigDecimal, BigDecimal> {
    override fun emit(input: BigDecimal): BigDecimal {
        val orderAmount = input
        return when (discountType) {
            DiscountType.FIXED -> {
                discountValue.min(orderAmount)
            }
            DiscountType.PERCENTAGE -> {
                val calculatedDiscount = orderAmount
                    .multiply(discountValue)
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
                when {
                    maxDiscountAmount != null -> calculatedDiscount.min(maxDiscountAmount)
                    else -> calculatedDiscount
                }.min(orderAmount)
            }
        }
    }
}
