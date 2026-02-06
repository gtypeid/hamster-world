package com.hamsterworld.ecommerce.app.order.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.order.constant.OrderStatus
import java.time.LocalDate

/**
 * 주문 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class OrderSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    val status: OrderStatus? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
