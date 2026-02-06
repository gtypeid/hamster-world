package com.hamsterworld.common.app

import java.time.LocalDate

/**
 * 페이징을 지원하는 공통 검색 쿼리 추상 클래스
 *
 * 외부 API에서는 public_id (String)를 사용
 */
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
