package com.hamsterworld.payment.domain.account.repository

import com.hamsterworld.payment.domain.account.constant.AccountType
import com.hamsterworld.payment.domain.account.model.Account
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.Optional

interface AccountJpaRepository : JpaRepository<Account, Long> {

    fun findByUserPublicIdAndAccountType(userPublicId: String, accountType: AccountType): Optional<Account>

    fun findByUserPublicId(userPublicId: String): List<Account>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :id")
    fun findByIdForUpdate(@Param("id") id: Long): Optional<Account>
}
