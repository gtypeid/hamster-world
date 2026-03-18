package com.hamsterworld.progression.domain.archive.service

import com.hamsterworld.progression.app.archive.response.UserArchiveDto
import com.hamsterworld.progression.app.archive.response.ClaimArchiveResponse
import com.hamsterworld.progression.domain.archive.dto.ArchiveSearchRequest
import com.hamsterworld.progression.domain.archive.model.ArchiveMaster
import com.hamsterworld.progression.domain.archive.model.UserArchiveProgress
import com.hamsterworld.progression.domain.archive.repository.UserArchiveProgressRepository
import com.hamsterworld.progression.web.csv.ArchiveMasterLoader
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Archive Service
 * 업적 시스템 비즈니스 로직 처리
 *
 * ## 조회 패턴
 * - 모든 조회는 search 메서드 사용 (통합)
 * - 특정 유저: searchList(ArchiveSearchRequest(userPublicId = "xxx"))
 * - 특정 아카이브: searchList(ArchiveSearchRequest(userPublicId = "xxx", archiveId = "yyy")).firstOrNull()
 */
@Service
class ArchiveService(
    private val archiveProgressRepository: UserArchiveProgressRepository,
    private val archiveMasterLoader: ArchiveMasterLoader
) {

    // ==================== Public API ====================

    /**
     * Archive 검색 (List DTO)
     */
    @Transactional(readOnly = true)
    fun searchListDto(search: ArchiveSearchRequest): List<UserArchiveDto> {
        val progresses = archiveProgressRepository.findAll(search)
        val allArchives = archiveMasterLoader.getAllArchiveMasters()
        val archiveMap = allArchives.associateBy { it.archiveId }

        return progresses.map { progress ->
            val archiveMaster = archiveMap[progress.archiveId]
                ?: throw IllegalStateException("Archive master not found: ${progress.archiveId}")
            UserArchiveDto.from(archiveMaster, progress)
        }
    }

    /**
     * Archive 검색 (Page DTO)
     */
    @Transactional(readOnly = true)
    fun searchPageDto(search: ArchiveSearchRequest): Page<UserArchiveDto> {
        val progressesPage = archiveProgressRepository.findAllPage(search)
        val allArchives = archiveMasterLoader.getAllArchiveMasters()
        val archiveMap = allArchives.associateBy { it.archiveId }

        val content = progressesPage.content.map { progress ->
            val archiveMaster = archiveMap[progress.archiveId]
                ?: throw IllegalStateException("Archive master not found: ${progress.archiveId}")
            UserArchiveDto.from(archiveMaster, progress)
        }

        return PageImpl(
            content,
            progressesPage.pageable,
            progressesPage.totalElements
        )
    }

    /**
     * Archive 보상 클레임
     */
    @Transactional
    fun claimReward(
        userPublicId: String,
        archiveId: String
    ): UserArchiveProgress {
        val archiveMaster = archiveMasterLoader.getArchiveMaster(archiveId)
            ?: throw IllegalArgumentException("Archive not found: $archiveId")

        val progress = archiveProgressRepository.findByUserPublicIdAndArchiveId(userPublicId, archiveId)
            ?: throw IllegalArgumentException("Archive progress not found for user: $userPublicId, archive: $archiveId")

        if (!progress.claim(archiveMaster)) {
            throw IllegalStateException("Cannot claim archive: already claimed or not completed")
        }

        return archiveProgressRepository.save(progress)
    }

    /**
     * Archive 보상 클레임 (DTO 반환)
     */
    @Transactional
    fun claimRewardDto(
        userPublicId: String,
        archiveId: String
    ): ClaimArchiveResponse {
        claimReward(userPublicId, archiveId)

        return ClaimArchiveResponse(
            success = true,
            message = "Archive claimed successfully"
        )
    }

    // ==================== Internal/Consumer용 ====================

    /**
     * Archive 진행도 업데이트 (Consumer 전용)
     */
    @Transactional
    fun updateArchiveProgress(
        userPublicId: String,
        archiveId: String,
        archiveMaster: ArchiveMaster,
        amount: Int = 1
    ): UserArchiveProgress {
        val progress = getOrCreateArchiveProgress(userPublicId, archiveId)
        progress.updateProgress(amount, archiveMaster.getRequirement())
        return archiveProgressRepository.save(progress)
    }

    // ==================== Private Helpers ====================

    private fun getOrCreateArchiveProgress(userPublicId: String, archiveId: String): UserArchiveProgress {
        return archiveProgressRepository.findByUserPublicIdAndArchiveId(userPublicId, archiveId)
            ?: archiveProgressRepository.save(
                UserArchiveProgress(
                    userPublicId = userPublicId,
                    archiveId = archiveId
                )
            )
    }
}
