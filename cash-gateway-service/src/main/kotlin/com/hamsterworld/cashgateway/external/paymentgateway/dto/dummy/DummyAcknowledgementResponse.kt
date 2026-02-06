package com.hamsterworld.cashgateway.external.paymentgateway.dto.dummy

import com.fasterxml.jackson.annotation.JsonProperty
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.AcknowledgementResponse

/**
 * Dummy PG 승인(Acknowledgement) 응답
 *
 * ## Dummy PG 특성
 * - 비동기 처리: 202 Accepted 반환
 * - 요청 접수 시 즉시 tid 발급
 * - 실제 결과는 Webhook으로 전달
 *
 * ## 응답 예시
 * ```json
 * {
 *   "status": "PENDING",
 *   "code": "ACK_OK",
 *   "transactionId": "DUMMY_20260201_123456",
 *   "message": "Payment request received",
 *   "echo": {
 *     "mid": "hamster_dummy_mid_001",
 *     "gatewayReferenceId": "CGW_DUMMY_..."
 *   }
 * }
 * ```
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