package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.CancelPaymentCtx

/**
 * PG Client Protocol
 *
 * ## 변경 사항 (Payment 제거)
 * - 기존: Payment 엔티티를 생성하고 반환
 * - 변경: PaymentProcess만 관리하고, 이벤트를 발행
 * - 이유: Cash Gateway는 Communication Truth (PG 통신 기록), Payment Service가 Business Truth
 */
interface PaymentGatewayClientProtocol {

    /**
     * PG 결제 요청
     *
     * ## 변경 사항
     * - 기존: Payment 반환
     * - 변경: Unit (이벤트 발행으로 처리)
     * - 비동기 PG의 경우 Webhook으로 결과 수신
     */
    fun payment(paymentCtx: ApprovePaymentCtx)

    /**
     * PG 취소 요청
     *
     * ## 변경 사항
     * - 기존: Payment 반환
     * - 변경: Unit (이벤트 발행으로 처리)
     */
    fun cancel(paymentCtx: CancelPaymentCtx)

    /**
     * PG Webhook 처리
     *
     * ## 변경 사항
     * - 기존: Payment 반환
     * - 변경: Unit (이벤트 발행으로 처리)
     *
     * @param rawPayload PG사에서 전송한 원본 payload (JSON string)
     */
    fun handleWebhook(rawPayload: String)

    /**
     * 이 Client가 담당하는 Provider 반환
     */
    fun getProvider(): Provider
}
