package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentCtx
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentRequest
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.PaymentResponse

interface PaymentGatewayProvider {
    fun getProvider(): Provider
    fun getEndpoint(): String
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
     * PG 응답으로부터 Cash Gateway MID 후보 목록을 추출
     *
     * **핵심 의도**:
     * PG사마다 응답 구조가 다르므로, 각 Provider가 자신의 방식으로
     * PG 응답에서 PG MID를 추출하고, 이를 Cash Gateway MID 후보 목록으로 변환하는 추상화.
     *
     * **PG MID ≠ Cash Gateway MID (N:1 관계)**:
     * - PG MID: PG사에 등록된 가맹점 ID (예: hamster_dummy_mid_001)
     * - Cash Gateway MID: Cash Gateway가 발급한 식별자 (예: CGW_MID_001)
     * - 하나의 PG MID에 여러 Cash Gateway MID가 매핑될 수 있음
     * - 따라서 PG MID 하나로는 Cash Gateway MID를 특정할 수 없으므로 후보 목록을 반환
     *
     * 호출자가 반환된 후보 목록 + 기타 context(orderNumber 등)를 조합하여
     * 정확한 Cash Gateway MID를 특정해야 함.
     *
     * @param response 파싱된 PG 응답
     * @return Cash Gateway MID 후보 목록, 추출 실패 시 빈 리스트
     */
    fun extractCashGatewayMidCandidates(response: PaymentResponse): List<String>

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

    /**
     * CashGatewayMid 자동 생성 시 매핑할 기본 PG MID
     *
     * 유저가 처음 결제 요청 시 CashGatewayMid가 존재하지 않으면,
     * 이 메서드가 반환하는 PG MID로 자동 생성된다.
     *
     * Provider마다 application.yml에서 설정된 기본 PG MID를 반환한다.
     *
     * @return 기본 PG MID (PG사에 등록된 실제 가맹점 ID)
     */
    fun getDefaultPgMid(): String
}
