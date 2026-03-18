package com.hamsterworld.payment.domain.accountrecord.repository

import com.hamsterworld.payment.domain.accountrecord.model.AccountRecord
import org.springframework.stereotype.Repository

@Repository
class AccountRecordRepository(
    private val accountRecordJpaRepository: AccountRecordJpaRepository
) {

    fun save(record: AccountRecord): AccountRecord {
        return accountRecordJpaRepository.save(record)
    }

    fun findByAccountId(accountId: Long): List<AccountRecord> {
        return accountRecordJpaRepository.findByAccountId(accountId)
    }
}
