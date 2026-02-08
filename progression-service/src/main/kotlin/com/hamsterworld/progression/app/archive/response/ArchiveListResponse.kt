package com.hamsterworld.progression.app.archive.response

import com.hamsterworld.progression.domain.archive.model.ArchiveMaster

/**
 * Archive 목록 응답
 */
data class ArchiveListResponse(
    val archives: List<ArchiveDto>
)

/**
 * Archive DTO
 */
data class ArchiveDto(
    val archiveId: String,
    val archiveCode: String,
    val name: String,
    val description: String,
    val archiveType: String,
    val progressType: String,
    val requirement: Int,
    val rewardType: String,
    val rewardAmount: Int,
    val sortOrder: Int
) {
    companion object {
        fun from(master: ArchiveMaster) = ArchiveDto(
            archiveId = master.archiveId,
            archiveCode = master.archiveCode,
            name = master.name,
            description = master.description,
            archiveType = master.archiveType.name,
            progressType = master.progressType.name,
            requirement = master.getRequirement(),
            rewardType = master.rewardType.name,
            rewardAmount = master.rewardAmount,
            sortOrder = master.sortOrder
        )
    }
}
