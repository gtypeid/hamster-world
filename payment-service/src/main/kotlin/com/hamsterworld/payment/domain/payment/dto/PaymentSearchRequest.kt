package com.hamsterworld.payment.domain.payment.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import java.math.BigDecimal
import java.time.LocalDate

data class PaymentSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    val orderPublicId: String? = null,
    val processPublicId: String? = null,
    val gatewayPaymentPublicId: String? = null,
    val minAmount: BigDecimal? = null,
    val maxAmount: BigDecimal? = null,
    val statuses: Set<PaymentStatus>? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
