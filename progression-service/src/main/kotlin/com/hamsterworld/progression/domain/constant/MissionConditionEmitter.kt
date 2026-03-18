package com.hamsterworld.progression.domain.constant

import com.hamsterworld.common.domain.condition.ConditionEmitter

data class MissionConditionEmitter(
    val rewardType: RewardType,
    val rewardAmount: Int
) : ConditionEmitter<Any, Int> {

    override fun emit(input: Any): Int {
        return rewardAmount
    }
}
