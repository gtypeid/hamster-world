package com.hamsterworld.progression.app.quota.controller

import com.hamsterworld.progression.app.quota.request.ClaimQuotaRequest
import com.hamsterworld.progression.app.quota.response.*
import com.hamsterworld.progression.domain.quota.dto.QuotaSearchRequest
import com.hamsterworld.progression.domain.quota.service.QuotaService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

/**
 * Quota API Controller
 */
@RestController
@RequestMapping("/api/quotas")
class QuotaController(
    private val quotaService: QuotaService
) {

    /**
     * Quota 검색 (List)
     *
     * Examples:
     * - 전체 조회: /api/quotas/search/list
     * - 특정 유저: /api/quotas/search/list?userPublicId=xxx
     * - 완료된 것만: /api/quotas/search/list?isCompleted=true
     */
    @GetMapping("/search/list")
    fun searchList(
        searchRequest: QuotaSearchRequest
    ): List<UserQuotaDto> {
        return quotaService.searchListDto(searchRequest)
    }

    /**
     * Quota 검색 (Page)
     */
    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: QuotaSearchRequest
    ): Page<UserQuotaDto> {
        return quotaService.searchPageDto(searchRequest)
    }

    /**
     * Quota 보상 클레임
     */
    @PostMapping("/{quotaKey}/claim")
    fun claim(
        @PathVariable quotaKey: String,
        @RequestBody request: ClaimQuotaRequest
    ): ClaimQuotaResponse {
        return quotaService.claimRewardDto(request.userPublicId, quotaKey)
    }
}
