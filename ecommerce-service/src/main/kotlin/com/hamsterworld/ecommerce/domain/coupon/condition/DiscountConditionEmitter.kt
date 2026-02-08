package com.hamsterworld.ecommerce.domain.coupon.condition

import com.hamsterworld.common.domain.condition.ConditionEmitter
import com.hamsterworld.ecommerce.domain.coupon.constant.DiscountType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Discount Condition Emitter
 *
 * 주문에 대한 할인 금액을 계산
 *
 * ## 할인 유형
 * - FIXED: 정액 할인 (예: 5000원 할인)
 * - PERCENTAGE: 정률 할인 (예: 10% 할인, 최대 10000원)
 *
 * ## 계산 예시
 * ```
 * 주문 금액: 50,000원
 *
 * FIXED (5000원):
 *   → 할인: 5,000원
 *
 * PERCENTAGE (10%, 최대 10000원):
 *   → 계산: 50,000 * 0.1 = 5,000원
 *   → 할인: 5,000원
 *
 * PERCENTAGE (10%, 최대 3000원):
 *   → 계산: 50,000 * 0.1 = 5,000원
 *   → 최대 제한: 3,000원
 *   → 할인: 3,000원
 * ```
 */
@Embeddable
class DiscountConditionEmitter(
    /**
     * 할인 유형 (FIXED, PERCENTAGE)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 50)
    var discountType: DiscountType = DiscountType.FIXED,

    /**
     * 할인 값
     * - FIXED: 할인 금액 (예: 5000)
     * - PERCENTAGE: 할인 비율 (예: 10 = 10%)
     */
    @Column(name = "discount_value", nullable = false, precision = 15, scale = 2)
    var discountValue: BigDecimal = BigDecimal.ZERO,

    /**
     * 최대 할인 금액 (PERCENTAGE일 때만 사용, null이면 제한 없음)
     */
    @Column(name = "max_discount_amount", nullable = true, precision = 15, scale = 2)
    var maxDiscountAmount: BigDecimal? = null
) : ConditionEmitter<BigDecimal, BigDecimal> {

    /**
     * 주문 금액에 대한 할인 금액 계산
     *
     * @param input 주문 금액
     * @return 할인 금액
     */
    override fun emit(input: BigDecimal): BigDecimal {
        val orderAmount = input

        return when (discountType) {
            DiscountType.FIXED -> {
                // 정액 할인: 할인 금액 그대로 반환 (단, 주문 금액보다 클 수 없음)
                discountValue.min(orderAmount)
            }

            DiscountType.PERCENTAGE -> {
                // 정률 할인: 주문 금액 * 할인 비율
                val calculatedDiscount = orderAmount
                    .multiply(discountValue)
                    .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)

                // 최대 할인 금액 제한 적용
                when {
                    maxDiscountAmount != null -> calculatedDiscount.min(maxDiscountAmount)
                    else -> calculatedDiscount
                }.min(orderAmount)  // 주문 금액보다 클 수 없음
            }
        }
    }
}
