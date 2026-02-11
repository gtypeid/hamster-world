package com.hamsterworld.ecommerce.domain.coupon.condition

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.common.domain.condition.ConditionFilter
import com.hamsterworld.common.domain.condition.ConditionFilterUtils
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Transient
import java.math.BigDecimal

/**
 * Coupon Usage Condition Filter
 *
 * 주문이 쿠폰 사용 조건을 만족하는지 확인
 *
 * ## 조건 예시
 * - 최소 주문 금액: 10,000원 이상
 * - 특정 카테고리: ["ELECTRONICS", "FASHION"]
 * - 특정 상품: [123, 456]
 * - 특정 판매자: [789]
 *
 * ## filtersJson 구조
 * ```json
 * {
 *   "categories": ["ELECTRONICS"],
 *   "productIds": [123, 456],
 *   "merchantIds": [789]
 * }
 * ```
 *
 * ## Input DTO
 * Service 레이어에서 CouponValidationInput을 생성하여 전달
 */
@Embeddable
class CouponUsageConditionFilter(
    /**
     * 최소 주문 금액 (0이면 제한 없음)
     */
    @Column(name = "min_order_amount", nullable = false, precision = 15, scale = 2)
    var minOrderAmount: BigDecimal = BigDecimal.ZERO,

    /**
     * 필터 JSON (카테고리, 상품, 판매자 제약)
     * null이면 제한 없음
     */
    @Column(name = "condition_filters", columnDefinition = "TEXT", nullable = true)
    override var filtersJson: String? = null
) : ConditionFilter<CouponValidationInput> {

    @Transient
    private val objectMapper = jacksonObjectMapper()

    /**
     * 주문이 쿠폰 사용 조건을 만족하는지 확인
     */
    override fun matches(input: CouponValidationInput): Boolean {
        // 1. 최소 주문 금액 체크 (0이면 제한 없음)
        if (minOrderAmount > BigDecimal.ZERO && input.totalAmount < minOrderAmount) {
            return false
        }

        // 2. filtersJson이 없으면 통과
        if (filtersJson.isNullOrBlank() || filtersJson == "{}") {
            return true
        }

        // 3. filtersJson 파싱
        val filters = try {
            ConditionFilterUtils.parseFilters(filtersJson!!, objectMapper)
        } catch (e: Exception) {
            return false
        }

        // 4. 카테고리 매칭
        if (filters.containsKey("categories")) {
            val orderCategories = input.categories.map { it.name }.toSet()
            if (!ConditionFilterUtils.matchesCategories(orderCategories, filters)) {
                return false
            }
        }

        // 5. 상품 ID 매칭
        if (filters.containsKey("productIds")) {
            if (!ConditionFilterUtils.matchesProductIds(input.productIds, filters)) {
                return false
            }
        }

        // 6. 판매자 ID 매칭
        if (filters.containsKey("merchantIds")) {
            if (!ConditionFilterUtils.matchesMerchantIdsSet(input.merchantIds, filters)) {
                return false
            }
        }

        return true
    }
}

/**
 * Coupon Validation Input
 *
 * 쿠폰 사용 가능 여부 검증을 위한 입력 DTO
 */
data class CouponValidationInput(
    val totalAmount: BigDecimal,
    val productIds: Set<Long>,
    val merchantIds: Set<Long>,
    val categories: Set<ProductCategory>
)
