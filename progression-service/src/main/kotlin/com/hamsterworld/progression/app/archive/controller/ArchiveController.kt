package com.hamsterworld.progression.app.archive.controller

import com.hamsterworld.progression.app.archive.request.ClaimArchiveRequest
import com.hamsterworld.progression.app.archive.response.*
import com.hamsterworld.progression.domain.archive.dto.ArchiveSearchRequest
import com.hamsterworld.progression.domain.archive.service.ArchiveService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

/**
 * Archive API Controller
 */
@RestController
@RequestMapping("/api/archives")
class ArchiveController(
    private val archiveService: ArchiveService
) {

    /**
     * Archive 검색 (List)
     *
     * Examples:
     * - 전체 조회: /api/archives/search/list
     * - 특정 유저: /api/archives/search/list?userPublicId=xxx
     * - 완료된 것만: /api/archives/search/list?isCompleted=true
     */
    @GetMapping("/search/list")
    fun searchList(
        searchRequest: ArchiveSearchRequest
    ): List<UserArchiveDto> {
        return archiveService.searchListDto(searchRequest)
    }

    /**
     * Archive 검색 (Page)
     */
    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: ArchiveSearchRequest
    ): Page<UserArchiveDto> {
        return archiveService.searchPageDto(searchRequest)
    }

    /**
     * Archive 보상 클레임
     */
    @PostMapping("/{archiveId}/claim")
    fun claim(
        @PathVariable archiveId: String,
        @RequestBody request: ClaimArchiveRequest
    ): ClaimArchiveResponse {
        archiveService.claimReward(request.userPublicId, archiveId)

        return ClaimArchiveResponse(
            success = true,
            message = "Archive claimed successfully"
        )
    }
}
