package com.hamsterworld.progression.app.quota.controller

import com.hamsterworld.progression.app.quota.request.ClaimQuotaRequest
import com.hamsterworld.progression.app.quota.response.*
import com.hamsterworld.progression.domain.quota.dto.QuotaSearchRequest
import com.hamsterworld.progression.domain.quota.service.QuotaService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/quotas")
class QuotaController(
    private val quotaService: QuotaService
) {

    @GetMapping("/search/list")
    fun searchList(
        searchRequest: QuotaSearchRequest
    ): List<UserQuotaDto> {
        return quotaService.searchListDto(searchRequest)
    }

    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: QuotaSearchRequest
    ): Page<UserQuotaDto> {
        return quotaService.searchPageDto(searchRequest)
    }

    @PostMapping("/{quotaKey}/claim")
    fun claim(
        @PathVariable quotaKey: String,
        @RequestBody request: ClaimQuotaRequest
    ): ClaimQuotaResponse {
        return quotaService.claimRewardDto(request.userPublicId, quotaKey)
    }
}
