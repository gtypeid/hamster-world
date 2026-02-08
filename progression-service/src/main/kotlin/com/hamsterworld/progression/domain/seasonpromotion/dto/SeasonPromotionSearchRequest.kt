package com.hamsterworld.progression.domain.seasonpromotion.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.progression.domain.seasonpromotion.constant.PromotionTargetRole
import java.time.LocalDate

/**
 * Season Promotion 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class SeasonPromotionSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    // SeasonPromotion specific
    val userPublicId: String? = null,
    val promotionId: String? = null,
    val targetRole: PromotionTargetRole? = null,
    val isVip: Boolean? = null,
    val minStep: Int? = null,
    val maxStep: Int? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
