package com.hamsterworld.progression.app.seasonpromotion.response

import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotion
import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotionMaster

/**
 * 유저별 Season Promotion 진행 현황 응답
 */
data class UserSeasonPromotionResponse(
    val userPublicId: String,
    val promotions: List<UserSeasonPromotionDto>
)

/**
 * 유저별 Season Promotion DTO
 */
data class UserSeasonPromotionDto(
    val promotionId: String,
    val title: String,
    val description: String,
    val targetRole: String,
    val maxStep: Int,
    val currentStep: Int,
    val isVip: Boolean,
    val claimedSteps: Set<Int>,
    val progressRate: Double,
    val isActive: Boolean,
    val startAt: String,
    val endAt: String,
    val basicRewardSteps: List<Int>,      // 기본 보상이 있는 스텝 목록
    val vipBonusSteps: List<Int>          // VIP 보너스가 있는 스텝 목록
) {
    companion object {
        fun from(
            master: SeasonPromotionMaster,
            promotion: SeasonPromotion?
        ) = UserSeasonPromotionDto(
            promotionId = master.promotionId,
            title = master.title,
            description = master.description,
            targetRole = master.targetRole.name,
            maxStep = master.maxStep,
            currentStep = promotion?.currentStep ?: 0,
            isVip = promotion?.isVip ?: false,
            claimedSteps = promotion?.claimedSteps?.toSet() ?: emptySet(),
            progressRate = promotion?.getProgressRate(master.maxStep) ?: 0.0,
            isActive = master.isActive(),
            startAt = master.startAt.toString(),
            endAt = master.endAt.toString(),
            basicRewardSteps = master.basicRewards.keys.sorted(),
            vipBonusSteps = master.vipBonusRewards.keys.sorted()
        )
    }
}
