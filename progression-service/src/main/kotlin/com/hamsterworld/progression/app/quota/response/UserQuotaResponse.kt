package com.hamsterworld.progression.app.quota.response

import com.hamsterworld.progression.domain.quota.model.Quota
import com.hamsterworld.progression.domain.quota.model.QuotaMaster

/**
 * 유저별 Quota 진행 현황 응답
 */
data class UserQuotaResponse(
    val userPublicId: String,
    val quotas: List<UserQuotaDto>
)

/**
 * 유저별 Quota DTO
 */
data class UserQuotaDto(
    val quotaKey: String,
    val name: String,
    val description: String,
    val maxLimit: Int,
    val consumed: Int,
    val isCompleted: Boolean,
    val isClaimed: Boolean,
    val remaining: Int,
    val cycleType: String,
    val rewardType: String?,
    val rewardAmount: Int?
) {
    companion object {
        fun from(
            master: QuotaMaster,
            quota: Quota?
        ) = UserQuotaDto(
            quotaKey = master.quotaKey,
            name = master.name,
            description = master.description,
            maxLimit = master.maxLimit,
            consumed = quota?.consumed ?: 0,
            isCompleted = quota?.isCompleted() ?: false,
            isClaimed = quota?.isClaimed() ?: false,
            remaining = quota?.remaining() ?: master.maxLimit,
            cycleType = master.cycleType.name,
            rewardType = master.rewardType?.name,
            rewardAmount = master.rewardAmount
        )
    }
}
