package com.hamsterworld.payment.domain.accountrecord.repository

import com.hamsterworld.payment.domain.accountrecord.model.AccountRecord
import org.springframework.data.jpa.repository.JpaRepository

interface AccountRecordJpaRepository : JpaRepository<AccountRecord, Long> {

    fun findByAccountId(accountId: Long): List<AccountRecord>
}
