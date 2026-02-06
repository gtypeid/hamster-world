package com.hamsterworld.ecommerce.app.user.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.common.domain.auth.UserRole
import java.time.LocalDate

/**
 * 사용자 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class UserSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 10,

    val userId: String? = null,  // Keycloak sub (UUID)
    val username: String? = null,
    val email: String? = null,
    val role: UserRole? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
