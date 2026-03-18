package com.hamsterworld.progression.domain.archive.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.progression.domain.archive.constant.ArchiveType
import java.time.LocalDate

data class ArchiveSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,
    val userPublicId: String? = null,
    val archiveId: String? = null,
    val archiveType: ArchiveType? = null,
    val isCompleted: Boolean? = null,
    val isClaimed: Boolean? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
