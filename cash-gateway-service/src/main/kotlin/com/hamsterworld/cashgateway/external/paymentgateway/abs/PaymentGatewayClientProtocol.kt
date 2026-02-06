package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.domain.payment.model.Payment
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx

interface PaymentGatewayClientProtocol {

    /**
     * PG 결제 요청
     *
     * @return Payment (동기 PG) 또는 null (비동기 PG - Webhook으로 결과 수신)
     */
    fun payment(paymentCtx: ApprovePaymentCtx): Payment?

    fun cancel(paymentCtx: CancelPaymentCtx): Payment

    /**
     * PG Webhook 처리
     *
     * @param rawPayload PG사에서 전송한 원본 payload (JSON string)
     * @return Payment (성공) 또는 null (실패/중복)
     */
    fun handleWebhook(rawPayload: String): Payment?

    /**ㅌ
     * 이 Client가 담당하는 Provider 반환
     */
    fun getProvider(): Provider
}
