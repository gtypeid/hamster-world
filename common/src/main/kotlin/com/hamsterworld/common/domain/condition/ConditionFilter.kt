package com.hamsterworld.common.domain.condition

/**
 * Condition Filter (진입 필터)
 *
 * "이 입력이 처리될 조건을 만족하는가?"를 판단합니다.
 *
 * ## 사용 예시
 *
 * ### Progression Service - MissionConditionFilter
 * ```
 * Event 수신 → matches(event) → true면 카운트
 * ```
 *
 * ### Ecommerce Service - CouponUsageConditionFilter
 * ```
 * Order 생성 → matches(order) → true면 쿠폰 사용 가능
 * ```
 *
 * @param T 입력 타입 (DomainEvent, Order 등)
 */
interface ConditionFilter<T> {

    /**
     * 입력이 조건을 만족하는가?
     *
     * @param input 검증할 입력
     * @return true면 조건 만족, false면 불만족
     */
    fun matches(input: T): Boolean

    /**
     * 필터 정보 (JSON)
     *
     * ## 공통 스펙
     * ```json
     * {
     *   "categories": ["ELECTRONICS", "FASHION"],
     *   "productIds": [123, 456],
     *   "merchantIds": [789]
     * }
     * ```
     *
     * 파싱은 [ConditionFilterUtils.parseFilters]를 사용하세요.
     */
    val filtersJson: String?
}
