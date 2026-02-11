package com.hamsterworld.ecommerce.domain.account.repository

import com.hamsterworld.ecommerce.domain.account.model.Account
import org.springframework.stereotype.Repository

@Repository
class AccountRepository(
    private val accountJpaRepository: AccountJpaRepository
) {

    fun save(account: Account): Account {
        return accountJpaRepository.save(account)
    }

    fun findByUserId(userId: Long): Account? {
        return accountJpaRepository.findByUserId(userId).orElse(null)
    }
}
