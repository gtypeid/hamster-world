package com.hamsterworld.progression.domain.archive.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.progression.domain.archive.event.ArchiveClaimedEvent
import com.hamsterworld.progression.domain.archive.event.InternalArchiveCompletedEvent
import com.hamsterworld.progression.domain.archive.event.InternalArchiveProgressUpdatedEvent
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * User Archive Progress (유저별 Archive 진행도)
 *
 * EVENT_BASED 업적의 유저별 진행도만 저장
 * STAT_BASED 업적은 UserStatistics를 참조하므로 레코드 불필요
 *
 * ## 이벤트 발행 패턴: 리치 도메인
 * - `registerEvent()`를 사용하여 도메인 내에서 이벤트 등록
 * - Service는 repository.save()만 호출
 * - Spring Data가 자동으로 이벤트 발행
 *
 * ## 발행 이벤트
 * - InternalArchiveProgressUpdatedEvent: 진행도 업데이트 (Internal)
 * - InternalArchiveCompletedEvent: 완료 (Internal)
 * - ArchiveClaimedEvent: 보상 클레임 (Kafka → Payment Service)
 */
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
    val archiveId: String,  // ArchiveMaster 참조

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

    /**
     * 완료 여부 조회
     */
    fun isCompleted(): Boolean = isCompleted

    /**
     * 클레임 여부 조회
     */
    fun isClaimed(): Boolean = isClaimed

    /**
     * 진행도 업데이트
     * @param amount 증가량
     * @param requirement 목표치
     * @return 완료 여부
     */
    fun updateProgress(amount: Int, requirement: Int): Boolean {
        if (isCompleted) return true

        currentProgress = minOf(currentProgress + amount, requirement)

        if (currentProgress >= requirement) {
            markAsCompleted()
            return true
        }

        // 진행도 업데이트 이벤트 (Internal)
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

    /**
     * 완료 처리
     */
    private fun markAsCompleted() {
        isCompleted = true
        completedAt = LocalDateTime.now()

        // 완료 이벤트 (Internal)
        registerEvent(InternalArchiveCompletedEvent(
            aggregateId = this.publicId,
            userPublicId = userPublicId,
            archiveId = archiveId
        ))
    }

    /**
     * 보상 클레임
     */
    fun claim(archiveMaster: ArchiveMaster): Boolean {
        if (!canClaim()) return false

        isClaimed = true
        claimedAt = LocalDateTime.now()

        // 클레임 이벤트 발행 → Payment Service로 (Kafka)
        registerEvent(ArchiveClaimedEvent(
            userPublicId = userPublicId,
            archiveId = archiveId,
            rewardType = archiveMaster.rewardType.name,
            rewardAmount = archiveMaster.rewardAmount
        ))

        return true
    }

    /**
     * 클레임 가능 여부
     */
    fun canClaim(): Boolean {
        return isCompleted && !isClaimed
    }

    /**
     * 진행률 (0.0 ~ 1.0)
     */
    fun getProgressRate(requirement: Int): Double {
        if (requirement == 0) return 1.0
        return currentProgress.toDouble() / requirement
    }
}
