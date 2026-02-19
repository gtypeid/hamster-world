package com.hamsterworld.hamsterpg.domain.paymentprocess.event

import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess

/**
 * PaymentProcess 승인 완료 내부 이벤트
 *
 * CAS를 통해 PROCESSING → SUCCESS 전이 후 발행
 * - PaymentProcessEventHandler에서 Payment 생성 + Notification 발송
 */
data class InternalPaymentProcessSucceededEvent(
    val process: PaymentProcess
)
