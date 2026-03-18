package com.hamsterworld.progression.app.archive.controller

import com.hamsterworld.progression.app.archive.request.ClaimArchiveRequest
import com.hamsterworld.progression.app.archive.response.*
import com.hamsterworld.progression.domain.archive.dto.ArchiveSearchRequest
import com.hamsterworld.progression.domain.archive.service.ArchiveService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/archives")
class ArchiveController(
    private val archiveService: ArchiveService
) {

    @GetMapping("/search/list")
    fun searchList(
        searchRequest: ArchiveSearchRequest
    ): List<UserArchiveDto> {
        return archiveService.searchListDto(searchRequest)
    }

    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: ArchiveSearchRequest
    ): Page<UserArchiveDto> {
        return archiveService.searchPageDto(searchRequest)
    }

    @PostMapping("/{archiveId}/claim")
    fun claim(
        @PathVariable archiveId: String,
        @RequestBody request: ClaimArchiveRequest
    ): ClaimArchiveResponse {
        return archiveService.claimRewardDto(request.userPublicId, archiveId)
    }
}
