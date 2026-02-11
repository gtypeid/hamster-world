package com.hamsterworld.ecommerce.domain.account.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 이커머스 계좌 (Read Model)
 *
 * Payment Service의 Account 잔액을 동기화받는 읽기 전용 캐시.
 * 진실의 원천(Source of Truth)은 Payment Service.
 *
 * User와 1:1 매핑 (userId unique)
 * accountType별 잔액을 각 컬럼으로 관리:
 * - consumerBalance: 컨슈머 포인트
 * - merchantBalance: 머천트 정산금 (추후)
 * - riderBalance: 라이더 정산금 (추후)
 */
@Entity
@Table(
    name = "accounts",
    indexes = [
        Index(name = "idx_accounts_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_accounts_user_id", columnList = "user_id", unique = true)
    ]
)
class Account(
    @Column(name = "user_id", nullable = false, unique = true)
    var userId: Long = 0,

    @Column(name = "consumer_balance", nullable = false, precision = 15, scale = 3)
    var consumerBalance: BigDecimal = BigDecimal.ZERO,

    @Column(name = "merchant_balance", nullable = false, precision = 15, scale = 3)
    var merchantBalance: BigDecimal = BigDecimal.ZERO,

    @Column(name = "rider_balance", nullable = false, precision = 15, scale = 3)
    var riderBalance: BigDecimal = BigDecimal.ZERO,

    @Column(name = "last_synced_at")
    var lastSyncedAt: LocalDateTime? = null
) : AbsDomain() {

    /**
     * accountType에 따라 해당 잔액 컬럼 업데이트
     */
    fun syncBalance(accountType: String, balance: BigDecimal): Account {
        when (accountType) {
            "CONSUMER" -> this.consumerBalance = balance
            "MERCHANT" -> this.merchantBalance = balance
            "RIDER" -> this.riderBalance = balance
            else -> throw IllegalArgumentException("Unknown account type: $accountType")
        }
        this.lastSyncedAt = LocalDateTime.now()
        return this
    }

    companion object {
        /**
         * 최초 동기화 시 Account 생성
         */
        fun create(userId: Long, accountType: String, balance: BigDecimal): Account {
            val account = Account(userId = userId)
            account.syncBalance(accountType, balance)
            return account
        }
    }
}
