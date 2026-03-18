package com.hamsterworld.payment.app.account.response

import com.hamsterworld.payment.domain.accountrecord.model.AccountRecord
import java.math.BigDecimal
import java.time.LocalDateTime

data class AccountRecordResponse(
    val recordPublicId: String,
    val accountPublicId: String,
    val amountDelta: BigDecimal,
    val reason: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(
            record: AccountRecord,
            accountPublicId: String
        ): AccountRecordResponse {
            return AccountRecordResponse(
                recordPublicId = record.publicId,
                accountPublicId = accountPublicId,
                amountDelta = record.amount,
                reason = record.reason,
                createdAt = record.createdAt
            )
        }
    }
}
