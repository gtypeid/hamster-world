package com.hamsterworld.payment.domain.account.handler

import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.domain.account.event.InternalAccountBalanceChangedEvent
import com.hamsterworld.payment.domain.account.model.Account
import com.hamsterworld.payment.domain.accountrecord.model.AccountRecord
import com.hamsterworld.payment.domain.accountrecord.repository.AccountRecordRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/**
 * Account 도메인 이벤트 핸들러
 *
 * ProductEventHandler 패턴과 동일:
 * - InternalAccountBalanceChangedEvent 수신 시 AccountRecord 생성
 * - isRecord=true일 때 잔액 재집계 수행
 *
 * @see com.hamsterworld.payment.domain.product.handler.ProductEventHandler
 */
@Component
class AccountEventHandler(
    private val accountRecordRepository: AccountRecordRepository,
    private val recordRepository: RecordRepository<Account>
) {
    private val log = LoggerFactory.getLogger(AccountEventHandler::class.java)

    /**
     * 잔액 변경 이벤트 핸들러 (Event Sourcing)
     *
     * 1. AccountRecord 생성 (변화량 delta만 저장)
     * 2. isRecord=true면 잔액 재집계
     */
    @EventListener
    fun handle(event: InternalAccountBalanceChangedEvent) {
        val account = event.account

        log.debug("[잔액 변경 이벤트 수신] publicId={}, amountDelta={}, currentBalance={}, reason={}",
            account.publicId, event.amountDelta, account.balance, event.reason)

        // AccountRecord 생성 (Event Sourcing - 변화량 delta만 저장)
        val record = AccountRecord(
            accountId = account.id!!,
            amount = event.amountDelta,
            reason = event.reason
        )

        val saved = accountRecordRepository.save(record)
        log.debug("[계좌 이력 저장 완료] recordId={}, accountId={}, amountDelta={}, reason={}",
            saved.id, saved.accountId, saved.amount, saved.reason)

        if (event.isRecord) {
            val accountId = account.id ?: throw IllegalStateException("Account ID cannot be null")
            val calcAccount = recordRepository.writeRecord(accountId)
            log.debug("[잔액 재집계 완료] accountId={}, 최종잔액={}, 변경량={}, 사유={}",
                calcAccount.id, calcAccount.balance, event.amountDelta, event.reason)
        }
    }
}
