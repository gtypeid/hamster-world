package com.hamsterworld.payment.domain.account.service

import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.app.account.response.AccountDetailResponse
import com.hamsterworld.payment.app.account.response.AccountRecordResponse
import com.hamsterworld.payment.app.account.response.AccountResponse
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.dto.AccountSearchRequest
import com.hamsterworld.payment.domain.account.model.Account
import com.hamsterworld.payment.domain.account.repository.AccountRepository
import com.hamsterworld.payment.domain.accountrecord.model.AccountRecord
import com.hamsterworld.payment.domain.accountrecord.repository.AccountRecordRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class AccountService(
    private val accountRepository: AccountRepository,
    private val accountRecordRepository: AccountRecordRepository,
    private val recordRepository: RecordRepository<Account>
) {
    private val log = LoggerFactory.getLogger(AccountService::class.java)

    @Transactional
    fun getOrCreateAccount(
        userPublicId: String,
        accountType: AccountType,
        initialBalance: BigDecimal = BigDecimal.ZERO
    ): Account {
        val existing = accountRepository.findByUserPublicIdAndAccountType(userPublicId, accountType)
        if (existing != null) return existing

        val account = Account(
            userPublicId = userPublicId,
            accountType = accountType,
            balance = initialBalance
        )

        val saved = accountRepository.save(account)

        if (initialBalance.compareTo(BigDecimal.ZERO) != 0) {
            val initialRecord = AccountRecord(
                accountId = saved.id!!,
                amount = initialBalance,
                reason = "계좌 초기 잔액 설정"
            )
            accountRecordRepository.save(initialRecord)
        }

        log.info("[계좌 생성] publicId={}, userPublicId={}, accountType={}, initialBalance={}",
            saved.publicId, userPublicId, accountType, initialBalance)

        return saved
    }

    @Transactional
    fun updateBalance(accountId: Long, delta: BigDecimal, reason: String) {
        val account = accountRepository.findById(accountId)
        val updated = account.updateBalanceByDelta(delta, reason)
        accountRepository.saveAndPublish(updated)
    }

    @Transactional(propagation = Propagation.MANDATORY)
    fun updateBalanceFromEvent(
        userPublicId: String,
        accountType: AccountType,
        delta: BigDecimal,
        reason: String
    ) {
        val account = accountRepository.findByUserPublicIdAndAccountType(userPublicId, accountType)
            ?: run {
                val newAccount = Account(
                    userPublicId = userPublicId,
                    accountType = accountType,
                    balance = BigDecimal.ZERO
                )
                accountRepository.save(newAccount)
            }

        val updated = account.updateBalanceByDelta(delta, reason)
        accountRepository.saveAndPublish(updated)
    }

    @Transactional(readOnly = true)
    fun searchAccounts(search: AccountSearchRequest): List<Account> {
        return accountRepository.findAll(search)
    }

    @Transactional(readOnly = true)
    fun searchAccountPage(search: AccountSearchRequest): Page<Account> {
        val pagedSearch = search.copy(paged = true)
        return accountRepository.findAllPage(pagedSearch)
    }

    @Transactional(readOnly = true)
    fun findAccountDetailByPublicId(publicId: String): AccountDetailData {
        val account = accountRepository.findByPublicId(publicId)
        val records = accountRecordRepository.findByAccountId(account.id!!)
        return AccountDetailData(account, records)
    }

    @Transactional(readOnly = true)
    fun findAccountsByUserPublicId(userPublicId: String): List<Account> {
        return accountRepository.findByUserPublicId(userPublicId)
    }

    @Transactional(readOnly = true)
    fun findAccountByUserPublicIdAndType(userPublicId: String, accountType: AccountType): Account? {
        return accountRepository.findByUserPublicIdAndAccountType(userPublicId, accountType)
    }

    data class AccountDetailData(
        val account: Account,
        val records: List<AccountRecord>
    )

    @Transactional(readOnly = true)
    fun searchAccountResponses(search: AccountSearchRequest): List<AccountResponse> {
        val accounts = accountRepository.findAll(search)
        return accounts.map { AccountResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun searchAccountResponsePage(search: AccountSearchRequest): Page<AccountResponse> {
        val pagedSearch = search.copy(paged = true)
        val accountsPage = accountRepository.findAllPage(pagedSearch)
        return accountsPage.map { AccountResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun findAccountDetailResponseByPublicId(publicId: String): AccountDetailResponse {
        val detailData = findAccountDetailByPublicId(publicId)

        val recordResponses = detailData.records.map { record ->
            AccountRecordResponse.from(
                record = record,
                accountPublicId = detailData.account.publicId
            )
        }

        return AccountDetailResponse.from(
            account = detailData.account,
            records = recordResponses
        )
    }

    @Transactional(readOnly = true)
    fun findAccountResponsesByUserPublicId(userPublicId: String): List<AccountResponse> {
        val accounts = accountRepository.findByUserPublicId(userPublicId)
        return accounts.map { AccountResponse.from(it) }
    }
}
