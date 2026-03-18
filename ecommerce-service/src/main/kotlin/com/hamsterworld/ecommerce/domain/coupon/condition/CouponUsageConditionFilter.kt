package com.hamsterworld.ecommerce.domain.coupon.condition
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.common.domain.condition.ConditionFilter
import com.hamsterworld.common.domain.condition.ConditionFilterUtils
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Transient
import java.math.BigDecimal
@Embeddable
class CouponUsageConditionFilter(
    @Column(name = "min_order_amount", nullable = false, precision = 15, scale = 2)
    var minOrderAmount: BigDecimal = BigDecimal.ZERO,
    @Column(name = "condition_filters", columnDefinition = "TEXT", nullable = true)
    override var filtersJson: String? = null
) : ConditionFilter<CouponValidationInput> {
    @Transient
    private val objectMapper = jacksonObjectMapper()
    override fun matches(input: CouponValidationInput): Boolean {
        if (minOrderAmount > BigDecimal.ZERO && input.totalAmount < minOrderAmount) {
            return false
        }
        if (filtersJson.isNullOrBlank() || filtersJson == "{}") {
            return true
        }
        val filters = try {
            ConditionFilterUtils.parseFilters(filtersJson!!, objectMapper)
        } catch (e: Exception) {
            return false
        }
        if (filters.containsKey("categories")) {
            val orderCategories = input.categories.map { it.name }.toSet()
            if (!ConditionFilterUtils.matchesCategories(orderCategories, filters)) {
                return false
            }
        }
        if (filters.containsKey("productIds")) {
            if (!ConditionFilterUtils.matchesProductIds(input.productIds, filters)) {
                return false
            }
        }
        if (filters.containsKey("merchantIds")) {
            if (!ConditionFilterUtils.matchesMerchantIdsSet(input.merchantIds, filters)) {
                return false
            }
        }
        return true
    }
}
data class CouponValidationInput(
    val totalAmount: BigDecimal,
    val productIds: Set<Long>,
    val merchantIds: Set<Long>,
    val categories: Set<ProductCategory>
)
