package com.hamsterworld.payment.domain.account.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.payment.domain.account.constant.AccountType
import java.time.LocalDate

data class AccountSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    // Account specific
    val userPublicId: String? = null,
    val accountTypes: Set<AccountType>? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
