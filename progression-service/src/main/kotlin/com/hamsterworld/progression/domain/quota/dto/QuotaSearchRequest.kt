package com.hamsterworld.progression.domain.quota.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.progression.domain.quota.constant.CycleType
import com.hamsterworld.progression.domain.quota.constant.QuotaType
import java.time.LocalDate

/**
 * Quota 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class QuotaSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    // Quota specific
    val userPublicId: String? = null,
    val quotaKey: String? = null,
    val cycleType: CycleType? = null,
    val quotaType: QuotaType? = null,
    val minConsumed: Int? = null,
    val maxConsumed: Int? = null,
    val isCompleted: Boolean? = null,
    val isClaimed: Boolean? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
