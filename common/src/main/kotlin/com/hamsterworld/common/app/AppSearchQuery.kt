package com.hamsterworld.common.app

import com.fasterxml.jackson.annotation.JsonFormat
import java.time.LocalDate

/**
 * 공통 검색 쿼리 추상 클래스
 *
 * 외부 API에서는 public_id (String)를 사용
 */
abstract class AppSearchQuery(
    @JsonFormat(pattern = "yyyy-MM-dd")
    open val from: LocalDate? = null,

    @JsonFormat(pattern = "yyyy-MM-dd")
    open val to: LocalDate? = null,

    open val match: Boolean = false,
    open val sort: SortDirection = SortDirection.DESC,
    open val publicIds: Set<String> = emptySet()
)
