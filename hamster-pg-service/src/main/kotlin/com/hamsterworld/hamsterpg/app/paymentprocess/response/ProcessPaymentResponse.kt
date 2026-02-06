package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal

/**
 * PG 초기 응답 (202 Accepted)
 *
 * 요청을 접수했음을 알리는 응답
 * - 실제 승인/실패 결과는 Webhook으로 전송됨
 */
data class ProcessPaymentResponse(
    @JsonProperty("status")
    val status: String = "PENDING",

    @JsonProperty("code")
    val code: String = "ACK_OK",

    @JsonProperty("transactionId")
    val transactionId: String,  // PG 내부 TID

    @JsonProperty("amount")
    val amount: BigDecimal,

    @JsonProperty("echo")
    val echo: Map<String, Any?> = emptyMap(),

    @JsonProperty("message")
    val message: String = "Payment request received and processing"
)
