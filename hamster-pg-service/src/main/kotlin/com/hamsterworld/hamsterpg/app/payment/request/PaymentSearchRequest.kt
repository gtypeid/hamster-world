package com.hamsterworld.hamsterpg.app.payment.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import java.time.LocalDate

/**
 * Payment 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class PaymentSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    val midId: String? = null,
    val tid: String? = null,
    val orderPublicId: String? = null,
    val status: PaymentStatus? = null,
    val notificationStatus: NotificationStatus? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
