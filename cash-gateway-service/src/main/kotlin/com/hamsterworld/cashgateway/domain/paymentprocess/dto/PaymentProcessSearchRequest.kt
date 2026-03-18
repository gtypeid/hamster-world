package com.hamsterworld.cashgateway.domain.paymentprocess.dto

import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import java.math.BigDecimal
import java.time.LocalDate

data class PaymentProcessSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    val orderPublicId: String? = null,
    val userKeycloakId: String? = null,
    val provider: Provider? = null,
    val cashGatewayMid: String? = null,
    val minAmount: BigDecimal? = null,
    val maxAmount: BigDecimal? = null,
    val statuses: Set<PaymentProcessStatus>? = null,
    val pgTransaction: String? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
