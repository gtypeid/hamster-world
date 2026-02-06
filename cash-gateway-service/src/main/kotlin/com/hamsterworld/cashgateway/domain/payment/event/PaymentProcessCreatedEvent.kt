package com.hamsterworld.cashgateway.domain.payment.event

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess

/**
 * 결제 프로세스 생성 이벤트
 *
 * **발행 시점**: PaymentProcess 생성 (PG 요청 전/후)
 *
 * **구독자**:
 * - ecommerce-service: Order 상태 → PAYMENT_PENDING (선택적)
 */
data class PaymentProcessCreatedEvent(
    val process: PaymentProcess
)
