package com.hamsterworld.progression.domain.seasonpromotion.model

import com.hamsterworld.common.domain.condition.ConditionEmitter
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.seasonpromotion.constant.PromotionTargetRole
import java.time.LocalDateTime

/**
 * Season Promotion Master Data (마스터 데이터)
 *
 * CSV에서 로딩하여 인메모리에 보관
 * DB에 저장하지 않음
 *
 * ## 특징
 * - 시즌별 프로모션 (기간 제한)
 * - Step 기반 진행 (Cycle 없음)
 * - 2-track: 기본 보상 + VIP 보너스
 * - Customer/Rider 모두 지원
 *
 * ## CSV 예시
 * ```csv
 * promotion_id,title,target_role,start_at,end_at,max_step,condition_type,condition_filters,requirement,sort_order
 * SPRING_2025,봄맞이 프로모션,CUSTOMER,2025-03-01T00:00:00,2025-03-31T23:59:59,20,CREATE_ORDER,{},1,100
 * ```
 *
 * ## 보상 CSV (별도)
 * ```csv
 * promotion_id,step,is_vip_bonus,reward_type,reward_amount
 * SPRING_2025,5,false,POINT,100
 * SPRING_2025,5,true,POINT,50
 * SPRING_2025,10,false,COUPON,200
 * ```
 */
data class SeasonPromotionMaster(
    val promotionId: String,
    val title: String,
    val description: String,
    val targetRole: PromotionTargetRole,
    val startAt: LocalDateTime,
    val endAt: LocalDateTime,
    val maxStep: Int,
    val condition: MissionCondition,  // 스텝 진행 조건
    val basicRewards: Map<Int, StepRewardEmitter>,      // step -> basic reward
    val vipBonusRewards: Map<Int, StepRewardEmitter>,   // step -> vip bonus
    val sortOrder: Int = 0
) {
    /**
     * Step Reward Emitter (스텝별 보상 생성)
     */
    data class StepRewardEmitter(
        val rewardType: RewardType,
        val rewardAmount: Int
    ) : ConditionEmitter<Any, Int> {

        override fun emit(input: Any): Int {
            return rewardAmount
        }
    }

    /**
     * 활성화된 프로모션인지 확인
     */
    fun isActive(now: LocalDateTime = LocalDateTime.now()): Boolean {
        return now in startAt..endAt
    }

    /**
     * 이벤트 매칭 체크
     */
    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        return condition.matchesEvent(eventType, eventFilters)
    }

    /**
     * 특정 스텝에 기본 보상이 있는지 확인
     */
    fun hasBasicReward(step: Int): Boolean {
        return basicRewards.containsKey(step)
    }

    /**
     * 특정 스텝에 VIP 보너스가 있는지 확인
     */
    fun hasVipBonus(step: Int): Boolean {
        return vipBonusRewards.containsKey(step)
    }

    /**
     * 특정 스텝의 기본 보상 조회
     */
    fun getBasicReward(step: Int): StepRewardEmitter? {
        return basicRewards[step]
    }

    /**
     * 특정 스텝의 VIP 보너스 조회
     */
    fun getVipBonus(step: Int): StepRewardEmitter? {
        return vipBonusRewards[step]
    }
}
