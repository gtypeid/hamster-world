package com.hamsterworld.progression.domain.archive.model

import com.hamsterworld.progression.domain.archive.constant.ArchiveType
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.mission.constant.ProgressType

/**
 * Archive Master Data (마스터 데이터)
 *
 * CSV에서 로딩하여 인메모리에 보관
 * DB에 저장하지 않음 (필요 시 추후 테이블로 전환 가능)
 *
 * ## 특징
 * - 일회성: 한 번 달성하면 끝 (초기화 없음)
 * - 수집 개념: 도감 시스템
 * - 보상: 한 번만 지급
 *
 * ## 진행 방식
 * - STAT_BASED: 통계 참조 (UserStatistics)
 * - EVENT_BASED: 이벤트 매칭 (UserArchiveProgress)
 *
 * ## CSV 예시
 * ```csv
 * archive_id,archive_code,name,description,archive_type,progress_type,condition_type,condition_filters,requirement,reward_type,reward_amount,sort_order
 * 1,FIRST_ORDER,첫 구매 완료,첫 주문을 완료했습니다,ORDER,EVENT_BASED,CREATE_ORDER,{},1,POINT,100,100
 * 2,HIGH_ORDER,고액 주문,10만원 이상 주문,ORDER,EVENT_BASED,CREATE_ORDER,{"minAmount":"100000"},1,POINT,200,110
 * 3,VIP_CUSTOMER,VIP 고객,총 구매액 100만원,ORDER,STAT_BASED,TOTAL_PURCHASE_AMOUNT,,1000000,POINT,1000,200
 * ```
 */
data class ArchiveMaster(
    val archiveId: String,
    val archiveCode: String,
    val name: String,
    val description: String,
    val archiveType: ArchiveType,
    val progressType: ProgressType,
    val sortOrder: Int = 0,

    // EVENT_BASED용
    val condition: MissionCondition? = null,

    // STAT_BASED용 (통계 키)
    val statKey: String? = null,

    // 보상
    val rewardType: RewardType,
    val rewardAmount: Int
) {
    /**
     * 통계 기반 업적인지 확인
     */
    fun isStatBased(): Boolean = progressType == ProgressType.STAT_BASED

    /**
     * 이벤트 기반 업적인지 확인
     */
    fun isEventBased(): Boolean = progressType == ProgressType.EVENT_BASED

    /**
     * 요구사항 (목표치)
     */
    fun getRequirement(): Int {
        return condition?.requirement ?: 1
    }

    /**
     * 이벤트 매칭 체크
     */
    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        if (!isEventBased()) return false
        return condition?.matchesEvent(eventType, eventFilters) ?: false
    }
}
