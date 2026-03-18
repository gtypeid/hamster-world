package com.hamsterworld.progression.domain.archive.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.progression.domain.archive.event.ArchiveClaimedEvent
import com.hamsterworld.progression.domain.archive.event.InternalArchiveCompletedEvent
import com.hamsterworld.progression.domain.archive.event.InternalArchiveProgressUpdatedEvent
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "user_archive_progress",
    indexes = [
        Index(name = "idx_user_archive_user", columnList = "user_public_id"),
        Index(name = "idx_user_archive_completed", columnList = "is_completed")
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_user_archive", columnNames = ["user_public_id", "archive_id"])
    ]
)
class UserArchiveProgress(
    @Column(name = "user_public_id", nullable = false)
    val userPublicId: String,

    @Column(name = "archive_id", nullable = false)
    val archiveId: String,

    @Column(name = "current_progress", nullable = false)
    var currentProgress: Int = 0,

    @Column(name = "is_completed", nullable = false)
    private var isCompleted: Boolean = false,

    @Column(name = "completed_at")
    private var completedAt: LocalDateTime? = null,

    @Column(name = "is_claimed", nullable = false)
    private var isClaimed: Boolean = false,

    @Column(name = "claimed_at")
    private var claimedAt: LocalDateTime? = null
) : AbsDomain() {

    fun isCompleted(): Boolean = isCompleted

    fun isClaimed(): Boolean = isClaimed

    fun updateProgress(amount: Int, requirement: Int): Boolean {
        if (isCompleted) return true

        currentProgress = minOf(currentProgress + amount, requirement)

        if (currentProgress >= requirement) {
            markAsCompleted()
            return true
        }

        registerEvent(InternalArchiveProgressUpdatedEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            archiveId = archiveId,
            progress = currentProgress,
            requirement = requirement,
            isCompleted = false
        ))

        return false
    }

    private fun markAsCompleted() {
        isCompleted = true
        completedAt = LocalDateTime.now()

        registerEvent(InternalArchiveCompletedEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            archiveId = archiveId
        ))
    }

    fun claim(archiveMaster: ArchiveMaster): Boolean {
        if (!canClaim()) return false

        isClaimed = true
        claimedAt = LocalDateTime.now()

        registerEvent(ArchiveClaimedEvent(
            userPublicId = userPublicId,
            archiveId = archiveId,
            rewardType = archiveMaster.rewardType.name,
            rewardAmount = archiveMaster.rewardAmount
        ))

        return true
    }

    fun canClaim(): Boolean {
        return isCompleted && !isClaimed
    }

    fun getProgressRate(requirement: Int): Double {
        if (requirement == 0) return 1.0
        return currentProgress.toDouble() / requirement
    }
}
