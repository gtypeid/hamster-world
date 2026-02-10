package com.hamsterworld.payment.domain.account.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.event.AccountBalanceSynchronizedEvent
import com.hamsterworld.payment.domain.account.event.InternalAccountBalanceChangedEvent
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * Account - 내부 계좌 (Event Sourcing 기반)
 *
 * Product 패턴과 동일한 구조:
 * - Product.stock ↔ Account.balance
 * - Product.ecommerceProductId ↔ Account.userPublicId
 * - Product.isSoldOut ↔ (불필요)
 *
 * ## Event Sourcing
 * - balance는 AccountRecord의 amount 합산으로 재계산 가능
 * - AccountRecord는 delta(+/-)만 저장
 *
 * ## 유니크 제약
 * - (userPublicId, accountType) 조합이 유니크
 * - 한 유저가 역할별로 별도의 계좌를 가짐
 */
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

    /**
     * 잔액 변경 (Event Sourcing - Delta 방식)
     *
     * Product.updateStockByDelta() 패턴과 동일
     *
     * @param delta 변경량 (양수: 적립, 음수: 사용)
     * @param reason 변경 사유
     * @return 변경된 Account
     */
    fun updateBalanceByDelta(delta: BigDecimal, reason: String): Account {
        val newBalance = this.balance.add(delta)
        this.balance = newBalance
        this.lastRecordedAt = LocalDateTime.now()

        // 1. InternalAccountBalanceChangedEvent 발행 (내부 도메인 이벤트)
        // - AccountEventHandler가 수신하여 AccountRecord 생성 (delta 저장)
        // - Account 객체를 직접 전달하여 영속성 컨텍스트 재조회 방지
        registerEvent(
            InternalAccountBalanceChangedEvent(
                account = this,
                amountDelta = delta,
                reason = reason
            )
        )

        // 2. AccountBalanceSynchronizedEvent 발행 (Kafka 전송용)
        // - DomainEventPublisher가 OutboxEvent로 저장
        // - OutboxEventProcessor가 Kafka로 전송
        registerEvent(
            AccountBalanceSynchronizedEvent(
                accountPublicId = this.publicId,
                userPublicId = this.userPublicId,
                accountType = this.accountType.name,
                balance = newBalance,    // 현재 잔액 (절대값)
                reason = reason
            )
        )

        return this
    }

    /**
     * Entity 복사 (copy 메서드)
     */
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
