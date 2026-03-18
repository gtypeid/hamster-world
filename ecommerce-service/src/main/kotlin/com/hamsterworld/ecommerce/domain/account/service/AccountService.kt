package com.hamsterworld.ecommerce.domain.account.service
import com.hamsterworld.common.domain.auth.UserRole
import com.hamsterworld.ecommerce.app.account.response.MyAccountResponse
import com.hamsterworld.ecommerce.domain.account.model.Account
import com.hamsterworld.ecommerce.domain.account.repository.AccountRepository
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
@Service
class AccountService(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository
) {
    private val log = LoggerFactory.getLogger(AccountService::class.java)
    @Transactional(propagation = Propagation.MANDATORY)
    fun syncBalance(userPublicId: String, accountType: String, balance: BigDecimal) {
        val user = userRepository.findByPublicId(userPublicId)
        val userId = user.id!!
        val account = accountRepository.findByUserId(userId)
        if (account != null) {
            account.syncBalance(accountType, balance)
            accountRepository.save(account)
            log.info(
                "잔액 동기화 완료: userId={}, accountType={}, balance={}",
                userId, accountType, balance
            )
        } else {
            val newAccount = Account.create(userId, accountType, balance)
            accountRepository.save(newAccount)
            log.info(
                "Account 생성 + 잔액 동기화: userId={}, accountType={}, balance={}",
                userId, accountType, balance
            )
        }
    }
    @Transactional(readOnly = true)
    fun getMyAccount(userId: Long): Account? {
        return accountRepository.findByUserId(userId)
    }
    @Transactional(readOnly = true)
    fun getMyAccountResponse(userId: Long, role: UserRole): MyAccountResponse {
        val account = accountRepository.findByUserId(userId)
        return if (account != null) {
            MyAccountResponse.from(account, role)
        } else {
            MyAccountResponse.empty(role)
        }
    }
}
