package com.hamsterworld.common.admin.dto

import java.math.BigDecimal

/**
 * Condition Emitter 공통 Request DTO
 *
 * 모든 정책 생성 API에서 사용되는 공통 결과 생성 Request입니다.
 *
 * ## 사용 서비스별 필드
 *
 * ### Progression Service (Reward)
 * - `rewardType`: RewardType (POINT, COUPON 등)
 * - `rewardAmount`: 보상 양 (POINT인 경우)
 * - `rewardContent`: 보상 내용 (COUPON인 경우, JSON)
 *
 * ### Ecommerce Service (Discount)
 * - `discountType`: DiscountType (FIXED_AMOUNT, PERCENTAGE)
 * - `discountValue`: 할인 값
 * - `maxDiscountAmount`: 최대 할인 금액 (정률 할인 시)
 *
 * ## 사용 예시
 *
 * ### Mission 생성 (포인트 보상)
 * ```kotlin
 * CreateMissionRequest(
 *     emitter = ConditionEmitterRequest(
 *         rewardType = "POINT",
 *         rewardAmount = 100
 *     ),
 *     ...
 * )
 * ```
 *
 * ### Mission 생성 (쿠폰 보상)
 * ```kotlin
 * CreateMissionRequest(
 *     emitter = ConditionEmitterRequest(
 *         rewardType = "COUPON",
 *         rewardContent = """{"couponCode": "SPRING2025"}"""
 *     ),
 *     ...
 * )
 * ```
 *
 * ### Coupon 생성 (정액 할인)
 * ```kotlin
 * CreateCouponRequest(
 *     emitter = ConditionEmitterRequest(
 *         discountType = "FIXED_AMOUNT",
 *         discountValue = 5000
 *     ),
 *     ...
 * )
 * ```
 *
 * ### Coupon 생성 (정률 할인)
 * ```kotlin
 * CreateCouponRequest(
 *     emitter = ConditionEmitterRequest(
 *         discountType = "PERCENTAGE",
 *         discountValue = 10,
 *         maxDiscountAmount = 5000
 *     ),
 *     ...
 * )
 * ```
 */
data class ConditionEmitterRequest(

    // ============ Reward 전용 필드 (Progression Service) ============

    /**
     * Reward Type (Progression Service 전용)
     *
     * 예: "POINT", "COUPON"
     */
    val rewardType: String? = null,

    /**
     * 보상 양 (Progression Service 전용)
     *
     * rewardType이 POINT일 때 사용
     * 예: 100 (100 포인트)
     */
    val rewardAmount: Int? = null,

    /**
     * 보상 내용 (Progression Service 전용)
     *
     * rewardType이 COUPON일 때 사용 (JSON)
     *
     * ## 스펙
     * ```json
     * {
     *   "couponCode": "SPRING2025"
     * }
     * ```
     */
    val rewardContent: String? = null,

    // ============ Discount 전용 필드 (Ecommerce Service) ============

    /**
     * Discount Type (Ecommerce Service 전용)
     *
     * 예: "FIXED_AMOUNT", "PERCENTAGE"
     */
    val discountType: String? = null,

    /**
     * 할인 값 (Ecommerce Service 전용)
     *
     * - FIXED_AMOUNT: 정액 할인 금액 (예: 5000 = 5000원 할인)
     * - PERCENTAGE: 할인율 (예: 10 = 10% 할인)
     */
    val discountValue: BigDecimal? = null,

    /**
     * 최대 할인 금액 (Ecommerce Service 전용)
     *
     * discountType이 PERCENTAGE일 때 사용
     * 예: 5000 (최대 5000원까지만 할인)
     */
    val maxDiscountAmount: BigDecimal? = null
)
