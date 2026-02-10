package com.hamsterworld.payment.domain.account.service

import com.hamsterworld.common.domain.eventsourcing.RecordRepository
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

    /**
     * 계좌 생성 (또는 기존 계좌 반환)
     *
     * @param userPublicId 사용자 Public ID
     * @param accountType 계좌 타입
     * @param initialBalance 초기 잔액
     * @return 생성된 (또는 기존) Account
     */
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

        // 초기 잔액이 있으면 Record 생성
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

    /**
     * 잔액 변경 (Event Sourcing - Delta 방식)
     *
     * Product.updateStockByDelta() -> ProductService.addProductRecord() 패턴과 동일
     *
     * @param accountId Account ID
     * @param delta 변경량 (양수: 적립, 음수: 사용)
     * @param reason 변경 사유
     */
    @Transactional
    fun updateBalance(accountId: Long, delta: BigDecimal, reason: String) {
        val account = accountRepository.findById(accountId)
        val updated = account.updateBalanceByDelta(delta, reason)
        accountRepository.saveAndPublish(updated)
    }

    /**
     * 잔액 변경 (Kafka Consumer 트랜잭션 참여)
     *
     * @param userPublicId 사용자 Public ID
     * @param accountType 계좌 타입
     * @param delta 변경량
     * @param reason 변경 사유
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun updateBalanceFromEvent(
        userPublicId: String,
        accountType: AccountType,
        delta: BigDecimal,
        reason: String
    ) {
        // 계좌가 없으면 생성
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

    // ===== 조회 (Read-Only) =====

    @Transactional(readOnly = true)
    fun searchAccounts(search: AccountSearchRequest): List<Account> {
        return accountRepository.findAll(search)
    }

    @Transactional(readOnly = true)
    fun searchAccountPage(search: AccountSearchRequest): Page<Account> {
        val pagedSearch = search.copy(paged = true)
        return accountRepository.findAllPage(pagedSearch)
    }

    /**
     * 계좌 상세 조회 (Public ID로 조회, Record 포함)
     */
    @Transactional(readOnly = true)
    fun findAccountDetailByPublicId(publicId: String): AccountDetailData {
        val account = accountRepository.findByPublicId(publicId)
        val records = accountRecordRepository.findByAccountId(account.id!!)
        return AccountDetailData(account, records)
    }

    /**
     * 사용자의 모든 계좌 조회
     */
    @Transactional(readOnly = true)
    fun findAccountsByUserPublicId(userPublicId: String): List<Account> {
        return accountRepository.findByUserPublicId(userPublicId)
    }

    /**
     * 사용자의 특정 타입 계좌 조회
     *
     * @param userPublicId 사용자 Public ID
     * @param accountType 계좌 타입
     * @return Account (없으면 null)
     */
    @Transactional(readOnly = true)
    fun findAccountByUserPublicIdAndType(userPublicId: String, accountType: AccountType): Account? {
        return accountRepository.findByUserPublicIdAndAccountType(userPublicId, accountType)
    }

    /**
     * Service 레이어 DTO - Account Detail 데이터
     */
    data class AccountDetailData(
        val account: Account,
        val records: List<AccountRecord>
    )
}
