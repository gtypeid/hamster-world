package com.hamsterworld.progression.domain.quota.model

import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.constant.MissionConditionEmitter
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.constant.QuotaType

data class QuotaMaster(
    val quotaId: String,
    val quotaKey: String,
    val name: String,
    val description: String,
    val cycleType: CycleType,
    val quotaType: QuotaType,
    val maxLimit: Int,
    val condition: MissionCondition,
    val emitter: MissionConditionEmitter?,
    val sortOrder: Int = 0
) {
    val rewardType: RewardType? get() = emitter?.rewardType
    val rewardAmount: Int? get() = emitter?.rewardAmount

    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        return condition.matchesEvent(eventType, eventFilters)
    }

    fun hasReward(): Boolean {
        return quotaType == QuotaType.ACTION_REWARD && rewardType != null
    }
}
