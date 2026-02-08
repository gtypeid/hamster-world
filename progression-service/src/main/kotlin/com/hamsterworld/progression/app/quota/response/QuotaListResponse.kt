package com.hamsterworld.progression.app.quota.response

import com.hamsterworld.progression.domain.quota.model.QuotaMaster

/**
 * Quota 목록 응답
 */
data class QuotaListResponse(
    val quotas: List<QuotaDto>
)

/**
 * Quota DTO
 */
data class QuotaDto(
    val quotaId: String,
    val quotaKey: String,
    val name: String,
    val description: String,
    val cycleType: String,
    val quotaType: String,
    val maxLimit: Int,
    val rewardType: String?,
    val rewardAmount: Int?,
    val sortOrder: Int
) {
    companion object {
        fun from(master: QuotaMaster) = QuotaDto(
            quotaId = master.quotaId,
            quotaKey = master.quotaKey,
            name = master.name,
            description = master.description,
            cycleType = master.cycleType.name,
            quotaType = master.quotaType.name,
            maxLimit = master.maxLimit,
            rewardType = master.rewardType?.name,
            rewardAmount = master.rewardAmount,
            sortOrder = master.sortOrder
        )
    }
}
