package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal

/**
 * PG 초기 응답 (202 Accepted - ACK)
 *
 * 요청을 접수했음을 알리는 응답.
 * tid를 반환하지 않음 - 아직 거래가 생성된 것이 아니므로.
 * 실제 승인/실패 결과는 Webhook(Notification)으로 전송됨.
 */
data class ProcessPaymentResponse(
    @JsonProperty("code")
    val code: String = "ACK_OK",

    @JsonProperty("amount")
    val amount: BigDecimal,

    @JsonProperty("message")
    val message: String = "Payment request accepted"
)
