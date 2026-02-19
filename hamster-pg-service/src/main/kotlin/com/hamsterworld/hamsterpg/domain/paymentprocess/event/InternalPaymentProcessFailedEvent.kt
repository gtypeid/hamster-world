package com.hamsterworld.hamsterpg.domain.paymentprocess.event

import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess

/**
 * PaymentProcess 실패 내부 이벤트
 *
 * CAS를 통해 PROCESSING → FAILED 전이 후 발행
 * - PaymentProcessEventHandler에서 Payment 생성 (실패도 유의미한 도메인 결과) + Notification 발송
 */
data class InternalPaymentProcessFailedEvent(
    val process: PaymentProcess,
    val reason: String
)
