package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse

interface PaymentGatewayProvider {
    fun getProvider(): Provider
    fun getEndpoint(): String
    fun getMid(): String  // 이 Provider의 MID (Merchant ID) 반환
    fun isSuccess(response: PaymentResponse): Boolean
    fun prepareRequest(paymentCtx: PaymentCtx): PaymentRequest
    fun parsePaymentResponse(payload: String): PaymentResponse

    /**
     * 이 Provider가 동기 응답을 최종 결과로 사용하는가?
     *
     * - true: 200 OK = 승인 완료 (동기 PG) → 즉시 Payment 생성
     * - false: 200 OK = 요청 접수 (비동기 PG) → Webhook으로 최종 결과 수신
     *
     * @return 기본값 false (비동기 방식)
     */
    fun isSynchronousApproval(): Boolean = false

    /**
     * Webhook/PG 응답에서 MID 추출
     *
     * 외부 거래 판별에 사용:
     * - 내부 거래: getMid()와 일치
     * - 외부 거래: getMid()와 불일치 → PgMerchantMapping에서 originSource 조회
     *
     * @param response 파싱된 PG 응답
     * @return MID (Merchant ID), 추출 실패 시 null
     */
    fun extractMid(response: PaymentResponse): String?

    /**
     * PG 요청 승인(Acknowledgement) 응답 파싱
     *
     * PG 요청 초기 응답 처리:
     * - 202 Accepted: 비동기 처리, 요청 접수됨
     * - 200 OK: 동기 또는 비동기 (내부 status로 판단)
     * - 4xx/5xx: 요청 실패
     *
     * PaymentResponse와 분리된 이유:
     * - parsePaymentResponse: Webhook 최종 결제 결과 파싱
     * - parseAcknowledgementResponse: 초기 요청 접수 확인 파싱
     *
     * @param payload 원본 응답 문자열
     * @param httpStatusCode HTTP 상태 코드 (200, 202 등)
     * @return 파싱된 승인 응답
     */
    fun parseAcknowledgementResponse(payload: String, httpStatusCode: String): AcknowledgementResponse
}
