package com.hamsterworld.progression.domain.constant

import com.hamsterworld.common.domain.condition.ConditionEmitter

/**
 * Mission Condition Emitter
 *
 * Mission/Archive/Quota 달성 시 보상 생성을 담당합니다.
 *
 * ## 사용처
 * - Archive: 업적 달성 시 보상
 * - Quota: 할당량 소비 시 보상
 * - SeasonPromotion: 스텝 달성 시 보상
 */
data class MissionConditionEmitter(
    val rewardType: RewardType,
    val rewardAmount: Int
) : ConditionEmitter<Any, Int> {

    override fun emit(input: Any): Int {
        return rewardAmount
    }
}
