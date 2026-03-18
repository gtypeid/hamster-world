package com.hamsterworld.common.app
import com.fasterxml.jackson.annotation.JsonFormat
import java.time.LocalDate
abstract class AppSearchQuery(
    @JsonFormat(pattern = "yyyy-MM-dd")
    open val from: LocalDate? = null,
    @JsonFormat(pattern = "yyyy-MM-dd")
    open val to: LocalDate? = null,
    open val match: Boolean = false,
    open val sort: SortDirection = SortDirection.DESC,
    open val publicIds: Set<String> = emptySet()
)
