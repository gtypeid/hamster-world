package com.hamsterworld.progression.app.archive.response

import com.hamsterworld.progression.domain.archive.model.ArchiveMaster
import com.hamsterworld.progression.domain.archive.model.UserArchiveProgress

/**
 * 유저별 Archive 진행 현황 응답
 */
data class UserArchiveResponse(
    val userPublicId: String,
    val archives: List<UserArchiveDto>
)

/**
 * 유저별 Archive DTO
 */
data class UserArchiveDto(
    val archiveId: String,
    val name: String,
    val description: String,
    val requirement: Int,
    val currentProgress: Int,
    val isCompleted: Boolean,
    val isClaimed: Boolean,
    val progressRate: Double,
    val rewardType: String,
    val rewardAmount: Int
) {
    companion object {
        fun from(
            master: ArchiveMaster,
            progress: UserArchiveProgress?
        ) = UserArchiveDto(
            archiveId = master.archiveId,
            name = master.name,
            description = master.description,
            requirement = master.getRequirement(),
            currentProgress = progress?.currentProgress ?: 0,
            isCompleted = progress?.isCompleted() ?: false,
            isClaimed = progress?.isClaimed() ?: false,
            progressRate = progress?.getProgressRate(master.getRequirement()) ?: 0.0,
            rewardType = master.rewardType.name,
            rewardAmount = master.rewardAmount
        )
    }
}
