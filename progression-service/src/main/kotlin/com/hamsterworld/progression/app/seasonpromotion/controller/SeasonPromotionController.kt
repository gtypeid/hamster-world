package com.hamsterworld.progression.app.seasonpromotion.controller

import com.hamsterworld.progression.app.seasonpromotion.request.ClaimSeasonPromotionRewardRequest
import com.hamsterworld.progression.app.seasonpromotion.response.ClaimSeasonPromotionRewardResponse
import com.hamsterworld.progression.app.seasonpromotion.response.UserSeasonPromotionDto
import com.hamsterworld.progression.domain.seasonpromotion.dto.SeasonPromotionSearchRequest
import com.hamsterworld.progression.domain.seasonpromotion.service.SeasonPromotionService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/season-promotions")
class SeasonPromotionController(
    private val seasonPromotionService: SeasonPromotionService
) {

    @GetMapping("/search/list")
    fun searchList(
        searchRequest: SeasonPromotionSearchRequest
    ): List<UserSeasonPromotionDto> {
        return seasonPromotionService.searchListDto(searchRequest)
    }

    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: SeasonPromotionSearchRequest
    ): Page<UserSeasonPromotionDto> {
        return seasonPromotionService.searchPageDto(searchRequest)
    }

    @PostMapping("/{promotionId}/claim")
    fun claimReward(
        @PathVariable promotionId: String,
        @RequestBody request: ClaimSeasonPromotionRewardRequest
    ): ClaimSeasonPromotionRewardResponse {
        return seasonPromotionService.claimRewardDto(
            userPublicId = request.userPublicId,
            promotionId = promotionId,
            step = request.step
        )
    }
}
