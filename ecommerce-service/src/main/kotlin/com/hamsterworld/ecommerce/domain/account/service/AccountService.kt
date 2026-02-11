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

    /**
     * 잔액 동기화 (Payment Service로부터)
     *
     * AccountBalanceSynchronizedEvent를 수신했을 때 호출됨.
     * Account가 없으면 생성, 있으면 해당 accountType 컬럼만 업데이트.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun syncBalance(userPublicId: String, accountType: String, balance: BigDecimal) {
        val user = userRepository.findByPublicId(userPublicId)
        val userId = user.id!!

        val account = accountRepository.findByUserId(userId)

        if (account != null) {
            // 기존 Account 업데이트
            account.syncBalance(accountType, balance)
            accountRepository.save(account)

            log.info(
                "잔액 동기화 완료: userId={}, accountType={}, balance={}",
                userId, accountType, balance
            )
        } else {
            // Account 최초 생성
            val newAccount = Account.create(userId, accountType, balance)
            accountRepository.save(newAccount)

            log.info(
                "Account 생성 + 잔액 동기화: userId={}, accountType={}, balance={}",
                userId, accountType, balance
            )
        }
    }

    /**
     * 내 계좌 조회
     *
     * @param userId 사용자 ID (내부)
     * @return Account 또는 null (아직 동기화 전)
     */
    @Transactional(readOnly = true)
    fun getMyAccount(userId: Long): Account? {
        return accountRepository.findByUserId(userId)
    }

    // DTO-returning methods for Controllers

    /**
     * 내 계좌 조회 후 MyAccountResponse 반환
     *
     * @param userId 사용자 ID (내부)
     * @param role 사용자 역할 (노출 범위 결정)
     * @return MyAccountResponse
     */
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
