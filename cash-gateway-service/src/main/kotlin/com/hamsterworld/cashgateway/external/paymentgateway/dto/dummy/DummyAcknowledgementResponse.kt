package com.hamsterworld.cashgateway.external.paymentgateway.dto.dummy

import com.fasterxml.jackson.annotation.JsonProperty
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse

/**
 * Dummy PG 승인(Acknowledgement) 응답
 *
 * ## Dummy PG 특성
 * - 비동기 처리: 202 Accepted 반환
 * - ACK에는 tid를 발급하지 않음 (아직 거래가 생성된 것이 아님)
 * - tid는 실제 승인/실패 Webhook에서 전달됨
 *
 * ## 실제 hamster-pg ACK 응답 예시
 * ```json
 * {
 *   "code": "ACK_OK",
 *   "amount": 10000,
 *   "message": "Payment request accepted"
 * }
 * ```
 *
 * 참고: hamster-pg는 ACK에 status, transactionId, echo를 반환하지 않음.
 * 해당 필드들은 다른 PG사 연동을 위한 확장 필드로, null/empty 기본값으로 동작함.
 */
data class DummyAcknowledgementResponse(
    @JsonProperty("status")
    val status: String = "",

    @JsonProperty("code")
    val code: String = "",

    @JsonProperty("transactionId")
    val transactionId: String? = null,

    @JsonProperty("message")
    val message: String = "",

    @JsonProperty("echo")
    val echo: Map<String, Any?> = emptyMap(),

    // HTTP Status Code (외부에서 설정)
    var httpStatusCode: String? = null
) : AcknowledgementResponse {

    companion object {
        const val ACK_SUCCESS_CODE = "ACK_OK"
        const val STATUS_PENDING = "PENDING"
        const val STATUS_SUCCESS = "SUCCESS"
        const val STATUS_FAILED = "FAILED"
    }

    override fun getAckCode(): String? = code

    override fun getAckMessage(): String? = message

    override fun getPgTransaction(): String? = transactionId

    /**
     * Dummy PG 승인 판단
     * - HTTP 202/200 + code가 ACK_OK
     * - 또는 status가 PENDING/SUCCESS
     */
    override fun isAcknowledged(): Boolean {
        val httpOk = httpStatusCode in listOf("200", "202")
        val codeOk = code == ACK_SUCCESS_CODE
        val statusOk = status in listOf(STATUS_PENDING, STATUS_SUCCESS)

        return httpOk && (codeOk || statusOk)
    }

    override fun getRawPayload(): String? = null
}