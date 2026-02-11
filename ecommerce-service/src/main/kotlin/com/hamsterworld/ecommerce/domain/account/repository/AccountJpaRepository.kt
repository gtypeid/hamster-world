package com.hamsterworld.ecommerce.domain.account.repository

import com.hamsterworld.ecommerce.domain.account.model.Account
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface AccountJpaRepository : JpaRepository<Account, Long> {
    fun findByUserId(userId: Long): Optional<Account>
}
