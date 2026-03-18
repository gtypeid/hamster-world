package com.hamsterworld.ecommerce.app.board.request
import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import java.time.LocalDate
data class BoardSearchRequest(
    val productPublicId: String,
    val category: BoardCategory? = null,
    val authorPublicId: String? = null,
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = true,
    override val page: Int = 0,
    override val size: Int = 20
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
