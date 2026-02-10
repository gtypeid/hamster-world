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

    /**
     * Account ID로 모든 AccountRecord 조회
     *
     * @param accountId Account ID
     * @return AccountRecord 목록 (잔액 변동 이력)
     */
    fun findByAccountId(accountId: Long): List<AccountRecord> {
        return accountRecordJpaRepository.findByAccountId(accountId)
    }
}
