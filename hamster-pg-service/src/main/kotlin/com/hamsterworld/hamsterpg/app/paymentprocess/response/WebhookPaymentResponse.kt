package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal

/**
 * Webhook 전송 응답
 *
 * Cash Gateway의 Webhook 엔드포인트로 전송하는 최종 결과
 */
data class WebhookPaymentResponse(
    @JsonProperty("status")
    val status: String,  // SUCCESS, FAILED

    @JsonProperty("code")
    val code: String,  // "0000" (성공) or 에러코드

    @JsonProperty("transactionId")
    val transactionId: String,

    @JsonProperty("approvalNo")
    val approvalNo: String? = null,  // 성공 시에만

    @JsonProperty("amount")
    val amount: BigDecimal,

    @JsonProperty("echo")
    val echo: Map<String, Any?> = emptyMap(),

    @JsonProperty("message")
    val message: String
)
