package com.hamsterworld.payment.domain.account.event

import com.hamsterworld.payment.domain.account.model.Account
import java.math.BigDecimal

/**
 * 잔액 변경 이벤트 (내부 도메인 이벤트)
 *
 * Payment Service 내부 -> AccountEventHandler (Spring @DomainEvents)
 *
 * ## 목적
 * - AccountRecord 생성 (Event Sourcing - amountDelta 필드 사용)
 * - AccountRecord에는 변화량(delta)만 저장
 * - AccountEventHandler에서 잔액 재집계
 *
 * ## 주의사항
 * - 이 이벤트는 Kafka로 직접 전송되지 않음 (내부 이벤트)
 * - Account 객체를 직접 포함하여 영속성 컨텍스트 조회 문제 방지
 *
 * @see com.hamsterworld.payment.domain.product.event.InternalProductStockChangedEvent
 */
data class InternalAccountBalanceChangedEvent(
    val account: Account,
    val amountDelta: BigDecimal,
    val reason: String,
    val isRecord: Boolean = true
)
