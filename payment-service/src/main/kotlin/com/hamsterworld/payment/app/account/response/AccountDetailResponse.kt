package com.hamsterworld.payment.app.account.response

import com.hamsterworld.payment.domain.account.model.Account

data class AccountDetailResponse(
    val account: AccountResponse,
    val records: List<AccountRecordResponse>
) {
    companion object {
        fun from(
            account: Account,
            records: List<AccountRecordResponse>
        ): AccountDetailResponse {
            return AccountDetailResponse(
                account = AccountResponse.from(account),
                records = records
            )
        }
    }
}
