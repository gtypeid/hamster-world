package com.hamsterworld.common.domain.condition

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

/**
 * Condition Filter 공통 유틸리티
 *
 * filtersJson 파싱 및 매칭 로직을 제공합니다.
 *
 * ## filtersJson 공통 스펙
 *
 * ```json
 * {
 *   "categories": ["ELECTRONICS", "FASHION"],
 *   "productIds": [123, 456],
 *   "merchantIds": [789]
 * }
 * ```
 *
 * ## 사용 예시
 *
 * ```kotlin
 * val filters = ConditionFilterUtils.parseFilters(filtersJson)
 *
 * val matched = ConditionFilterUtils.matchesCategories(
 *     setOf("ELECTRONICS"),
 *     filters
 * )
 * ```
 */
object ConditionFilterUtils {

    /**
     * filtersJson 파싱
     *
     * @param filtersJson JSON 문자열
     * @param objectMapper ObjectMapper 인스턴스
     * @return 파싱된 Map (key: 필터 이름, value: 필터 값)
     */
    fun parseFilters(filtersJson: String, objectMapper: ObjectMapper): Map<String, Any> {
        return objectMapper.readValue(filtersJson)
    }

    /**
     * 카테고리 필터 매칭
     *
     * @param inputCategories 입력 카테고리 Set (예: 주문의 상품 카테고리들)
     * @param filters 파싱된 필터 Map
     * @return true면 조건 만족 (inputCategories 중 하나라도 허용된 카테고리에 포함)
     */
    fun matchesCategories(
        inputCategories: Set<String>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedCategories = filters["categories"] as? List<*>
            ?: return true  // 필터가 없으면 모두 통과

        val allowedCategoriesSet = allowedCategories.mapNotNull { it as? String }.toSet()

        if (allowedCategoriesSet.isEmpty()) {
            return true  // 빈 리스트면 모두 통과
        }

        return inputCategories.any { it in allowedCategoriesSet }
    }

    /**
     * Product ID 필터 매칭
     *
     * @param inputProductIds 입력 Product ID Set
     * @param filters 파싱된 필터 Map
     * @return true면 조건 만족 (inputProductIds 중 하나라도 허용된 상품에 포함)
     */
    fun matchesProductIds(
        inputProductIds: Set<Long>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedProductIds = filters["productIds"] as? List<*>
            ?: return true  // 필터가 없으면 모두 통과

        val allowedProductIdsSet = allowedProductIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()

        if (allowedProductIdsSet.isEmpty()) {
            return true  // 빈 리스트면 모두 통과
        }

        return inputProductIds.any { it in allowedProductIdsSet }
    }

    /**
     * Merchant ID 필터 매칭
     *
     * @param inputMerchantId 입력 Merchant ID
     * @param filters 파싱된 필터 Map
     * @return true면 조건 만족 (inputMerchantId가 허용된 판매자에 포함)
     */
    fun matchesMerchantIds(
        inputMerchantId: Long,
        filters: Map<String, Any>
    ): Boolean {
        val allowedMerchantIds = filters["merchantIds"] as? List<*>
            ?: return true  // 필터가 없으면 모두 통과

        val allowedMerchantIdsSet = allowedMerchantIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()

        if (allowedMerchantIdsSet.isEmpty()) {
            return true  // 빈 리스트면 모두 통과
        }

        return inputMerchantId in allowedMerchantIdsSet
    }

    /**
     * Merchant IDs 필터 매칭 (여러 개)
     *
     * @param inputMerchantIds 입력 Merchant ID Set
     * @param filters 파싱된 필터 Map
     * @return true면 조건 만족 (inputMerchantIds 중 하나라도 허용된 판매자에 포함)
     */
    fun matchesMerchantIdsSet(
        inputMerchantIds: Set<Long>,
        filters: Map<String, Any>
    ): Boolean {
        val allowedMerchantIds = filters["merchantIds"] as? List<*>
            ?: return true  // 필터가 없으면 모두 통과

        val allowedMerchantIdsSet = allowedMerchantIds.mapNotNull {
            when (it) {
                is Int -> it.toLong()
                is Long -> it
                else -> null
            }
        }.toSet()

        if (allowedMerchantIdsSet.isEmpty()) {
            return true  // 빈 리스트면 모두 통과
        }

        return inputMerchantIds.any { it in allowedMerchantIdsSet }
    }
}
