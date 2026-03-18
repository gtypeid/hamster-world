package com.hamsterworld.progression.domain.seasonpromotion.repository

import com.hamsterworld.progression.domain.seasonpromotion.model.SeasonPromotion
import org.springframework.data.jpa.repository.JpaRepository

/**
 * Season Promotion JPA Repository
 * Spring Data JPA 기본 메서드만 제공
 */
interface SeasonPromotionJpaRepository : JpaRepository<SeasonPromotion, Long> {

    fun findByUserPublicId(userPublicId: String): List<SeasonPromotion>

    fun findByUserPublicIdAndPromotionId(userPublicId: String, promotionId: String): SeasonPromotion?

    fun findByPromotionId(promotionId: String): List<SeasonPromotion>

    fun existsByUserPublicIdAndPromotionId(userPublicId: String, promotionId: String): Boolean
}
