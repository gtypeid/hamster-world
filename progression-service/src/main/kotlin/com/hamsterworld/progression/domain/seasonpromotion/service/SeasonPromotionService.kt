package com.hamsterworld.progression.domain.seasonpromotion.service

import com.hamsterworld.progression.app.seasonpromotion.response.UserSeasonPromotionDto
import com.hamsterworld.progression.domain.seasonpromotion.dto.SeasonPromotionSearchRequest
import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotion
import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotionMaster
import com.hamsterworld.progression.domain.seasonpromotion.repository.SeasonPromotionRepository
import com.hamsterworld.progression.web.csv.SeasonPromotionMasterLoader
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

/**
 * Season Promotion Service
 * 시즌 프로모션 비즈니스 로직 처리
 *
 * ## 조회 패턴
 * - 모든 조회는 search 메서드 사용 (통합)
 * - 특정 유저: searchListDto(SeasonPromotionSearchRequest(userPublicId = "xxx"))
 * - 특정 프로모션: searchListDto(SeasonPromotionSearchRequest(promotionId = "yyy"))
 */
@Service
class SeasonPromotionService(
    private val seasonPromotionRepository: SeasonPromotionRepository,
    private val seasonPromotionMasterLoader: SeasonPromotionMasterLoader
) {

    // ==================== Public API ====================

    /**
     * Season Promotion 검색 (List DTO)
     */
    @Transactional(readOnly = true)
    fun searchListDto(search: SeasonPromotionSearchRequest): List<UserSeasonPromotionDto> {
        val promotions = seasonPromotionRepository.findAll(search)
        val allMasters = seasonPromotionMasterLoader.getAllPromotionMasters()
        val masterMap = allMasters.associateBy { it.promotionId }

        return promotions.map { promotion ->
            val master = masterMap[promotion.promotionId]
                ?: throw IllegalStateException("Promotion master not found: ${promotion.promotionId}")
            UserSeasonPromotionDto.from(master, promotion)
        }
    }

    /**
     * Season Promotion 검색 (Page DTO)
     */
    @Transactional(readOnly = true)
    fun searchPageDto(search: SeasonPromotionSearchRequest): Page<UserSeasonPromotionDto> {
        val promotionsPage = seasonPromotionRepository.findAllPage(search)
        val allMasters = seasonPromotionMasterLoader.getAllPromotionMasters()
        val masterMap = allMasters.associateBy { it.promotionId }

        val content = promotionsPage.content.map { promotion ->
            val master = masterMap[promotion.promotionId]
                ?: throw IllegalStateException("Promotion master not found: ${promotion.promotionId}")
            UserSeasonPromotionDto.from(master, promotion)
        }

        return PageImpl(
            content,
            promotionsPage.pageable,
            promotionsPage.totalElements
        )
    }

    /**
     * 보상 클레임
     *
     * @param userPublicId 유저 PublicID
     * @param promotionId 프로모션 ID
     * @param step 클레임할 스텝
     */
    @Transactional
    fun claimReward(
        userPublicId: String,
        promotionId: String,
        step: Int
    ): SeasonPromotion {
        val master = seasonPromotionMasterLoader.getPromotionMaster(promotionId)
            ?: throw IllegalArgumentException("Promotion not found: $promotionId")

        // 프로모션 활성화 확인
        if (!master.isActive()) {
            throw IllegalStateException("Promotion is not active: $promotionId")
        }

        val promotion = seasonPromotionRepository.findByUserPublicIdAndPromotionId(userPublicId, promotionId)
            ?: throw IllegalArgumentException("Promotion not found for user: $userPublicId, promotion: $promotionId")

        promotion.claimReward(step, master)
        return seasonPromotionRepository.save(promotion)
    }

    // ==================== Internal/Consumer용 ====================

    /**
     * 스텝 진행 (Consumer 전용)
     *
     * @param userPublicId 유저 PublicID
     * @param master 프로모션 마스터
     * @param amount 진행량 (기본 1)
     * @return 업데이트된 SeasonPromotion
     */
    @Transactional
    fun advanceStep(
        userPublicId: String,
        master: SeasonPromotionMaster,
        amount: Int = 1
    ): SeasonPromotion {
        val promotion = getOrCreatePromotion(userPublicId, master)

        val advanced = promotion.advanceStep(amount, master.maxStep)
        if (advanced == 0) {
            // 이미 최대 스텝 도달 (에러는 아님)
            return promotion
        }

        return seasonPromotionRepository.save(promotion)
    }

    /**
     * VIP 활성화 (WalletEventConsumer 전용)
     *
     * @param userPublicId 유저 PublicID
     * @param promotionId 프로모션 ID
     */
    @Transactional
    fun activateVip(
        userPublicId: String,
        promotionId: String
    ): SeasonPromotion {
        val promotion = seasonPromotionRepository.findByUserPublicIdAndPromotionId(userPublicId, promotionId)
            ?: throw IllegalArgumentException("Promotion not found for user: $userPublicId, promotion: $promotionId")

        promotion.activateVip()
        return seasonPromotionRepository.save(promotion)
    }

    /**
     * VIP 비활성화 (WalletEventConsumer 전용)
     *
     * @param userPublicId 유저 PublicID
     * @param promotionId 프로모션 ID
     */
    @Transactional
    fun deactivateVip(
        userPublicId: String,
        promotionId: String
    ): SeasonPromotion {
        val promotion = seasonPromotionRepository.findByUserPublicIdAndPromotionId(userPublicId, promotionId)
            ?: throw IllegalArgumentException("Promotion not found for user: $userPublicId, promotion: $promotionId")

        promotion.deactivateVip()
        return seasonPromotionRepository.save(promotion)
    }

    // ==================== Private Helpers ====================

    private fun getOrCreatePromotion(userPublicId: String, master: SeasonPromotionMaster): SeasonPromotion {
        val existing = seasonPromotionRepository.findByUserPublicIdAndPromotionId(userPublicId, master.promotionId)

        if (existing != null) {
            return existing
        }

        // DDD 팩토리 메서드 사용
        val promotion = SeasonPromotion.create(
            userPublicId = userPublicId,
            promotionId = master.promotionId
        )
        return seasonPromotionRepository.save(promotion)
    }
}
