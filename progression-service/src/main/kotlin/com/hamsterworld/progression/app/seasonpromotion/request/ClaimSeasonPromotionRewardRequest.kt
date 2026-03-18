package com.hamsterworld.progression.app.seasonpromotion.request

data class ClaimSeasonPromotionRewardRequest(
    val userPublicId: String,
    val step: Int
)
