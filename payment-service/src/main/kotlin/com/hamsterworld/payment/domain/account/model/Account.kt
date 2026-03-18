package com.hamsterworld.payment.domain.account.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.event.AccountBalanceSynchronizedEvent
import com.hamsterworld.payment.domain.account.event.InternalAccountBalanceChangedEvent
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "accounts",
    indexes = [
        Index(name = "idx_accounts_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_accounts_user_public_id", columnList = "user_public_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_accounts_user_account_type",
            columnNames = ["user_public_id", "account_type"]
        )
    ]
)
class Account(
    @Column(name = "user_public_id", nullable = false, length = 20)
    var userPublicId: String = "",

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false, length = 20)
    var accountType: AccountType = AccountType.CONSUMER,

    @Column(nullable = false, precision = 15, scale = 3)
    var balance: BigDecimal = BigDecimal.ZERO,

    var lastRecordedAt: LocalDateTime? = null
) : AbsDomain() {

    fun updateBalanceByDelta(delta: BigDecimal, reason: String): Account {
        val newBalance = this.balance.add(delta)
        this.balance = newBalance
        this.lastRecordedAt = LocalDateTime.now()

        registerEvent(
            InternalAccountBalanceChangedEvent(
                account = this,
                amountDelta = delta,
                reason = reason
            )
        )

        registerEvent(
            AccountBalanceSynchronizedEvent(
                accountPublicId = this.publicId,
                userPublicId = this.userPublicId,
                accountType = this.accountType.name,
                balance = newBalance,
                reason = reason
            )
        )

        return this
    }

    fun copy(
        userPublicId: String = this.userPublicId,
        accountType: AccountType = this.accountType,
        balance: BigDecimal = this.balance,
        lastRecordedAt: LocalDateTime? = this.lastRecordedAt
    ): Account {
        val copied = Account(
            userPublicId = userPublicId,
            accountType = accountType,
            balance = balance,
            lastRecordedAt = lastRecordedAt
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
}
