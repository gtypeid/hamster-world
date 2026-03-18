package com.hamsterworld.payment.app.account.response

import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.model.Account
import java.math.BigDecimal
import java.time.LocalDateTime

data class AccountResponse(
    val accountPublicId: String,
    val userPublicId: String,
    val accountType: AccountType,
    val balance: BigDecimal,
    val lastRecordedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(account: Account): AccountResponse {
            return AccountResponse(
                accountPublicId = account.publicId,
                userPublicId = account.userPublicId,
                accountType = account.accountType,
                balance = account.balance,
                lastRecordedAt = account.lastRecordedAt,
                createdAt = account.createdAt,
                modifiedAt = account.modifiedAt
            )
        }
    }
}
