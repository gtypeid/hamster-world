package com.hamsterworld.progression.app.seasonpromotion.controller

import com.hamsterworld.progression.app.seasonpromotion.request.ClaimSeasonPromotionRewardRequest
import com.hamsterworld.progression.app.seasonpromotion.response.ClaimSeasonPromotionRewardResponse
import com.hamsterworld.progression.app.seasonpromotion.response.UserSeasonPromotionDto
import com.hamsterworld.progression.domain.seasonpromotion.dto.SeasonPromotionSearchRequest
import com.hamsterworld.progression.domain.seasonpromotion.service.SeasonPromotionService
import org.springframework.data.domain.Page
import org.springframework.web.bind.annotation.*

/**
 * Season Promotion API Controller
 */
@RestController
@RequestMapping("/api/season-promotions")
class SeasonPromotionController(
    private val seasonPromotionService: SeasonPromotionService
) {

    /**
     * Season Promotion 검색 (List)
     *
     * Examples:
     * - 전체 조회: /api/season-promotions/search/list
     * - 특정 유저: /api/season-promotions/search/list?userPublicId=xxx
     * - 특정 프로모션: /api/season-promotions/search/list?promotionId=SPRING_2025
     * - VIP만: /api/season-promotions/search/list?isVip=true
     */
    @GetMapping("/search/list")
    fun searchList(
        searchRequest: SeasonPromotionSearchRequest
    ): List<UserSeasonPromotionDto> {
        return seasonPromotionService.searchListDto(searchRequest)
    }

    /**
     * Season Promotion 검색 (Page)
     */
    @GetMapping("/search/page")
    fun searchPage(
        searchRequest: SeasonPromotionSearchRequest
    ): Page<UserSeasonPromotionDto> {
        return seasonPromotionService.searchPageDto(searchRequest)
    }

    /**
     * Season Promotion 보상 클레임
     */
    @PostMapping("/{promotionId}/claim")
    fun claimReward(
        @PathVariable promotionId: String,
        @RequestBody request: ClaimSeasonPromotionRewardRequest
    ): ClaimSeasonPromotionRewardResponse {
        seasonPromotionService.claimReward(
            userPublicId = request.userPublicId,
            promotionId = promotionId,
            step = request.step
        )

        return ClaimSeasonPromotionRewardResponse(
            success = true,
            message = "Season promotion reward claimed successfully"
        )
    }
}
