package com.hamsterworld.hamsterpg.app.pgmid.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import java.time.LocalDate

/**
 * PG MID 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class PgMidSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 10,

    val midId: String? = null,
    val merchantName: String? = null,
    val isActive: Boolean? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
