package com.hamsterworld.ecommerce.app.account.response

import com.hamsterworld.common.domain.auth.UserRole
import com.hamsterworld.ecommerce.domain.account.model.Account
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 내 계좌 잔액 응답 DTO
 *
 * 역할(Role)에 따라 노출되는 잔액이 다름:
 * - USER: consumerBalance만
 * - MERCHANT: consumerBalance + merchantBalance
 * - ADMIN 이상: 전체
 */
data class MyAccountResponse(
    val balances: List<BalanceInfo>,
    val lastSyncedAt: LocalDateTime?
) {
    data class BalanceInfo(
        val accountType: String,
        val balance: BigDecimal
    )

    companion object {
        fun from(account: Account, role: UserRole): MyAccountResponse {
            val balances = mutableListOf<BalanceInfo>()

            // Consumer 잔액은 모든 유저에게 노출
            balances.add(BalanceInfo("CONSUMER", account.consumerBalance))

            // Merchant 잔액은 MERCHANT 이상에게 노출
            if (role.isHigherOrEqualTo(UserRole.MERCHANT)) {
                balances.add(BalanceInfo("MERCHANT", account.merchantBalance))
            }

            // Admin 이상이면 Rider 잔액도 노출
            if (role.isHigherOrEqualTo(UserRole.ADMIN)) {
                balances.add(BalanceInfo("RIDER", account.riderBalance))
            }

            return MyAccountResponse(
                balances = balances,
                lastSyncedAt = account.lastSyncedAt
            )
        }

        /**
         * Account가 아직 없는 경우 (동기화 전) 기본 응답
         */
        fun empty(role: UserRole): MyAccountResponse {
            val balances = mutableListOf<BalanceInfo>()

            balances.add(BalanceInfo("CONSUMER", BigDecimal.ZERO))

            if (role.isHigherOrEqualTo(UserRole.MERCHANT)) {
                balances.add(BalanceInfo("MERCHANT", BigDecimal.ZERO))
            }

            if (role.isHigherOrEqualTo(UserRole.ADMIN)) {
                balances.add(BalanceInfo("RIDER", BigDecimal.ZERO))
            }

            return MyAccountResponse(
                balances = balances,
                lastSyncedAt = null
            )
        }
    }
}
