package com.hamsterworld.progression.domain.seasonpromotion.model

import com.hamsterworld.common.domain.condition.ConditionEmitter
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.seasonpromotion.constant.PromotionTargetRole
import java.time.LocalDateTime

data class SeasonPromotionMaster(
    val promotionId: String,
    val title: String,
    val description: String,
    val targetRole: PromotionTargetRole,
    val startAt: LocalDateTime,
    val endAt: LocalDateTime,
    val maxStep: Int,
    val condition: MissionCondition,
    val basicRewards: Map<Int, StepRewardEmitter>,
    val vipBonusRewards: Map<Int, StepRewardEmitter>,
    val sortOrder: Int = 0
) {
    data class StepRewardEmitter(
        val rewardType: RewardType,
        val rewardAmount: Int
    ) : ConditionEmitter<Any, Int> {

        override fun emit(input: Any): Int {
            return rewardAmount
        }
    }

    fun isActive(now: LocalDateTime = LocalDateTime.now()): Boolean {
        return now in startAt..endAt
    }

    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        return condition.matchesEvent(eventType, eventFilters)
    }

    fun hasBasicReward(step: Int): Boolean {
        return basicRewards.containsKey(step)
    }

    fun hasVipBonus(step: Int): Boolean {
        return vipBonusRewards.containsKey(step)
    }

    fun getBasicReward(step: Int): StepRewardEmitter? {
        return basicRewards[step]
    }

    fun getVipBonus(step: Int): StepRewardEmitter? {
        return vipBonusRewards[step]
    }
}
