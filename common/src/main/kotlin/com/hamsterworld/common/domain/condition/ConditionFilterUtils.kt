package com.hamsterworld.common.domain.condition
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
object ConditionFilterUtils {
    fun parseFilters(filtersJson: String, objectMapper: ObjectMapper): Map<String, Any> {
        return objectMapper.readValue(filtersJson)
    }
    fun matchesCategories(
        inputCategories: Set<String>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedCategories = filters["categories"] as? List<*>
            ?: return true
        val allowedCategoriesSet = allowedCategories.mapNotNull { it as? String }.toSet()
        if (allowedCategoriesSet.isEmpty()) {
            return true
        }
        return inputCategories.any { it in allowedCategoriesSet }
    }
    fun matchesProductIds(
        inputProductIds: Set<Long>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedProductIds = filters["productIds"] as? List<*>
            ?: return true
        val allowedProductIdsSet = allowedProductIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()
        if (allowedProductIdsSet.isEmpty()) {
            return true
        }
        return inputProductIds.any { it in allowedProductIdsSet }
    }
    fun matchesMerchantIds(
        inputMerchantId: Long,
        filters: Map<String, Any>
    ): Boolean {
        val allowedMerchantIds = filters["merchantIds"] as? List<*>
            ?: return true
        val allowedMerchantIdsSet = allowedMerchantIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()
        if (allowedMerchantIdsSet.isEmpty()) {
            return true
        }
        return inputMerchantId in allowedMerchantIdsSet
    }
    fun matchesMerchantIdsSet(
        inputMerchantIds: Set<Long>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedMerchantIds = filters["merchantIds"] as? List<*>
            ?: return true
        val allowedMerchantIdsSet = allowedMerchantIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()
        if (allowedMerchantIdsSet.isEmpty()) {
            return true
        }
        return inputMerchantIds.any { it in allowedMerchantIdsSet }
    }
}
