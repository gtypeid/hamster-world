package com.hamsterworld.common.app
import java.time.LocalDate
abstract class AppPagedSearchQuery(
    from: LocalDate? = null,
    to: LocalDate? = null,
    match: Boolean = false,
    sort: SortDirection = SortDirection.DESC,
    publicIds: Set<String> = emptySet(),
    open val paged: Boolean = false,
    open val page: Int = 0,
    open val size: Int = 5
) : AppSearchQuery(from, to, match, sort, publicIds) {
    fun getOffset(): Long = page.toLong() * size
}
