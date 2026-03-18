package com.hamsterworld.payment.domain.account.event

import com.hamsterworld.payment.domain.account.model.Account
import java.math.BigDecimal

data class InternalAccountBalanceChangedEvent(
    val account: Account,
    val amountDelta: BigDecimal,
    val reason: String,
    val isRecord: Boolean = true
)
