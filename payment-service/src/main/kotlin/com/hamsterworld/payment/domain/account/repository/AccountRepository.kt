package com.hamsterworld.payment.domain.account.repository

import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.eqOrNull
import com.hamsterworld.common.web.QuerydslExtension.inOrNullSafe
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.dto.AccountSearchRequest
import com.hamsterworld.payment.domain.account.model.Account
import com.hamsterworld.payment.domain.account.model.QAccount.account
import com.hamsterworld.payment.domain.accountrecord.model.QAccountRecord.accountRecord
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDateTime

@Repository
class AccountRepository(
    private val accountJpaRepository: AccountJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val eventPublisher: ApplicationEventPublisher
) : RecordRepository<Account> {

    fun save(account: Account): Account {
        return accountJpaRepository.save(account)
    }

    @Transactional
    fun saveAndPublish(account: Account): Account {
        val saved = accountJpaRepository.save(account)
        account.pullDomainEvents().forEach { eventPublisher.publishEvent(it) }
        return saved
    }

    fun findById(id: Long): Account {
        return accountJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("계좌를 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): Account {
        return jpaQueryFactory.selectFrom(account)
            .where(account.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("계좌를 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findByUserPublicIdAndAccountType(userPublicId: String, accountType: AccountType): Account? {
        return accountJpaRepository.findByUserPublicIdAndAccountType(userPublicId, accountType)
            .orElse(null)
    }

    fun findByUserPublicId(userPublicId: String): List<Account> {
        return accountJpaRepository.findByUserPublicId(userPublicId)
    }

    fun update(account: Account): Account {
        val copy = account.copy()
        copy.modifiedAt = LocalDateTime.now()
        return accountJpaRepository.save(copy)
    }

    fun findAll(search: AccountSearchRequest): List<Account> {
        val query = baseQuery(search)
        return applySorts(query, account.createdAt, search.sort)
            .fetch()
    }

    fun findAllPage(search: AccountSearchRequest): Page<Account> {
        val baseQuery = baseQuery(search)

        val total = jpaQueryFactory
            .select(account.count())
            .from(account)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val accounts = applySorts(pagedQuery, account.createdAt, search.sort)
            .fetch()

        return PageImpl(accounts, PageRequest.of(search.page, search.size), total)
    }

    @Transactional(readOnly = true)
    override fun readRecord(id: Long): Account {
        return baseRecord(id)
    }

    @Transactional(propagation = Propagation.MANDATORY, isolation = Isolation.READ_COMMITTED)
    override fun writeRecord(id: Long): Account {
        val lockedEntity = accountJpaRepository.findByIdForUpdate(id)
            .orElseThrow { CustomRuntimeException("계좌를 찾을 수 없습니다. ID: $id") }

        val recalculated = baseRecord(id)

        lockedEntity.balance = recalculated.balance
        lockedEntity.lastRecordedAt = recalculated.lastRecordedAt

        return lockedEntity
    }

    private fun baseRecord(id: Long): Account {
        val account = accountJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("계좌를 찾을 수 없습니다. ID: $id") }

        val calculatedBalance = jpaQueryFactory
            .select(accountRecord.amount.sum())
            .from(accountRecord)
            .where(accountRecord.accountId.eq(id))
            .fetchOne()

        val totalBalance = calculatedBalance ?: BigDecimal.ZERO

        return account.copy(
            balance = totalBalance,
            lastRecordedAt = LocalDateTime.now()
        )
    }

    private fun baseQuery(
        search: AccountSearchRequest
    ): JPQLQuery<Account> {
        return jpaQueryFactory
            .selectFrom(account)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(
        search: AccountSearchRequest
    ): List<BooleanExpression> {
        return listOfNotNull(
            between(account.createdAt, search.from, search.to),
            inOrNullSafe(account.publicId, search.publicIds),
            eqOrNull(account.userPublicId, search.userPublicId),
            inOrNullSafe(account.accountType, search.accountTypes)
        )
    }
}
