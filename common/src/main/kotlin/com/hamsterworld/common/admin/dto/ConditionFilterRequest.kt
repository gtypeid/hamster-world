package com.hamsterworld.common.admin.dto

import java.math.BigDecimal

/**
 * Condition Filter 공통 Request DTO
 *
 * 모든 정책 생성 API에서 사용되는 공통 필터 Request입니다.
 *
 * ## 사용 서비스별 필드
 *
 * ### Progression Service (Mission)
 * - `missionType`: MissionType (CREATE_ORDER, COMPLETE_DELIVERY 등)
 * - `requirement`: 달성 조건 (몇 번 수행해야 하는가)
 * - `filtersJson`: 이벤트 필터
 *
 * ### Ecommerce Service (Coupon)
 * - `minOrderAmount`: 최소 주문 금액
 * - `filtersJson`: 주문 필터
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
 * ### Mission 생성
 * ```kotlin
 * CreateMissionRequest(
 *     filter = ConditionFilterRequest(
 *         missionType = "CREATE_ORDER",
 *         requirement = 5,
 *         filtersJson = """{"categories": ["ELECTRONICS"]}"""
 *     ),
 *     ...
 * )
 * ```
 *
 * ### Coupon 생성
 * ```kotlin
 * CreateCouponRequest(
 *     filter = ConditionFilterRequest(
 *         minOrderAmount = 30000,
 *         filtersJson = """{"categories": ["ELECTRONICS"]}"""
 *     ),
 *     ...
 * )
 * ```
 */
data class ConditionFilterRequest(

    // ============ Mission 전용 필드 ============

    /**
     * Mission Type (Progression Service 전용)
     *
     * 예: "CREATE_ORDER", "COMPLETE_DELIVERY"
     */
    val missionType: String? = null,

    /**
     * 달성 조건 (Progression Service 전용)
     *
     * 몇 번 수행해야 미션이 완료되는가?
     * 예: 5 (5회 주문 생성)
     */
    val requirement: Int? = null,

    // ============ Coupon 전용 필드 ============

    /**
     * 최소 주문 금액 (Ecommerce Service 전용)
     *
     * 쿠폰 사용을 위한 최소 주문 금액
     * 예: 30000 (3만원 이상 주문 시 사용 가능)
     */
    val minOrderAmount: BigDecimal? = null,

    // ============ 공통 필드 ============

    /**
     * 필터 정보 (JSON)
     *
     * ## 스펙
     * ```json
     * {
     *   "categories": ["ELECTRONICS", "FASHION"],
     *   "productIds": [123, 456],
     *   "merchantIds": [789]
     * }
     * ```
     *
     * - `categories`: 상품 카테고리 필터
     * - `productIds`: 특정 상품 필터
     * - `merchantIds`: 특정 판매자 필터
     */
    val filtersJson: String? = null
)
