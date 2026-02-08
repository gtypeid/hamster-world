package com.hamsterworld.common.domain.condition

/**
 * Condition Emitter (결과 생성)
 *
 * "처리 결과로 무엇을 생성할 것인가?"를 정의합니다.
 *
 * ## 사용 예시
 *
 * ### Progression Service - MissionConditionEmitter
 * ```
 * Mission 달성 → emit(mission) → Reward(POINT, 100)
 * ```
 *
 * ### Ecommerce Service - DiscountConditionEmitter
 * ```
 * Coupon 사용 → emit(order) → BigDecimal(5000) // 할인 금액
 * ```
 *
 * @param I 입력 타입 (Mission, Order 등)
 * @param O 출력 타입 (Reward, BigDecimal 등)
 */
interface ConditionEmitter<I, O> {

    /**
     * 입력을 받아 결과 생성
     *
     * @param input 입력 데이터
     * @return 생성된 결과
     */
    fun emit(input: I): O
}
