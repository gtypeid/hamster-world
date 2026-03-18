package com.hamsterworld.ecommerce.app.account.response
import com.hamsterworld.common.domain.auth.UserRole
import com.hamsterworld.ecommerce.domain.account.model.Account
import java.math.BigDecimal
import java.time.LocalDateTime
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
            balances.add(BalanceInfo("CONSUMER", account.consumerBalance))
            if (role.isHigherOrEqualTo(UserRole.MERCHANT)) {
                balances.add(BalanceInfo("MERCHANT", account.merchantBalance))
            }
            if (role.isHigherOrEqualTo(UserRole.ADMIN)) {
                balances.add(BalanceInfo("RIDER", account.riderBalance))
            }
            return MyAccountResponse(
                balances = balances,
                lastSyncedAt = account.lastSyncedAt
            )
        }
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
