package com.hamsterworld.progression.domain.quota.model

import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.constant.MissionConditionEmitter
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.constant.QuotaType

/**
 * Quota Master Data (마스터 데이터)
 *
 * CSV에서 로딩하여 인메모리에 보관
 *
 * ## 특징
 * - 주기적 리셋 (DAILY/WEEKLY/MONTHLY)
 * - 항상 EVENT_BASED (STAT_BASED 없음)
 * - ACTION_REWARD: 반복 보상
 * - ACTION_CONSTRAINT: 행동 제약
 *
 * ## CSV 예시
 * ```csv
 * quota_id,quota_key,name,description,cycle_type,quota_type,max_limit,condition_type,condition_filters,requirement,reward_type,reward_amount,sort_order
 * 1,WEEKLY_SHOPPER,주간 쇼핑왕,일주일 5회 구매,WEEKLY,ACTION_REWARD,5,CREATE_ORDER,{},1,POINT,300,100
 * 2,DAILY_LOGIN,일일 방문,매일 로그인,DAILY,ACTION_REWARD,1,USER_LOGIN,{},1,POINT,10,50
 * 3,WEEKLY_COUPON,주간 쿠폰 사용,주 3회까지,WEEKLY,ACTION_CONSTRAINT,3,USE_COUPON,{},1,,,200
 * ```
 */
data class QuotaMaster(
    val quotaId: String,
    val quotaKey: String,
    val name: String,
    val description: String,
    val cycleType: CycleType,
    val quotaType: QuotaType,
    val maxLimit: Int,
    val condition: MissionCondition,  // 항상 필요
    val emitter: MissionConditionEmitter?,  // ACTION_CONSTRAINT는 null
    val sortOrder: Int = 0
) {
    // 하위 호환성을 위한 computed properties
    val rewardType: RewardType? get() = emitter?.rewardType
    val rewardAmount: Int? get() = emitter?.rewardAmount
    /**
     * 이벤트 매칭 체크
     */
    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        return condition.matchesEvent(eventType, eventFilters)
    }

    /**
     * 보상이 있는지 확인
     */
    fun hasReward(): Boolean {
        return quotaType == QuotaType.ACTION_REWARD && rewardType != null
    }
}
