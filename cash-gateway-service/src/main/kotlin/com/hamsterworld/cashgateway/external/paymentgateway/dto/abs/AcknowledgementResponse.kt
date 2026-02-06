package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

/**
 * PG 요청 승인(Acknowledgement) 응답 인터페이스
 *
 * ## 역할
 * - PG 요청 접수 확인 응답 (202 Accepted, 200 OK 등)
 * - 실제 결제 결과가 아닌 "요청을 받았다"는 확인 응답
 * - 각 PG사별로 다른 승인 형식을 통일된 인터페이스로 처리
 *
 * ## 구현 예시
 * - 비동기 PG: 202 Accepted 또는 200 OK with "PENDING" status
 * - 동기 PG: 200 OK with immediate result
 * - 일부 PG: 200 OK 내부에 status code로 구분
 *
 * @see PaymentResponse 실제 결제 결과 응답
 */
interface AcknowledgementResponse {
    /**
     * 승인 코드
     *
     * PG사별 코드 체계
     * - HTTP Status Code (202, 200)
     * - 내부 코드 ("ACK_OK", "RECEIVED" 등)
     */
    fun getAckCode(): String?

    /**
     * 승인 메시지
     *
     * 예: "Request received", "Payment queued", "처리 중"
     */
    fun getAckMessage(): String?

    /**
     * PG 거래 ID
     *
     * 일부 PG는 요청 승인 시점에 tid를 즉시 발급
     * 없으면 null 반환
     */
    fun getPgTransaction(): String?

    /**
     * 요청 승인 여부
     *
     * - true: PG가 요청을 정상 접수함 (처리 예정)
     * - false: PG가 요청을 거부함 (재시도 필요)
     *
     * 각 PG Provider가 자체 기준으로 판단
     * - HTTP 202/200 = true
     * - HTTP 4xx/5xx = false
     * - 내부 코드 기반 판단
     */
    fun isAcknowledged(): Boolean

    /**
     * 원본 응답 데이터
     *
     * 디버깅/로깅용 원본 페이로드
     */
    fun getRawPayload(): String? = null
}