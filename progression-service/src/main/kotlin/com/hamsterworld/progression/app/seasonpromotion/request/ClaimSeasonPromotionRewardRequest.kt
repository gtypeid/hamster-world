package com.hamsterworld.progression.app.seasonpromotion.request

/**
 * Season Promotion 보상 클레임 요청
 */
data class ClaimSeasonPromotionRewardRequest(
    val userPublicId: String,
    val step: Int
)
