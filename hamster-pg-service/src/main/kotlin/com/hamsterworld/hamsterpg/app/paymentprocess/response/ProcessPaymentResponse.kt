package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal

data class ProcessPaymentResponse(
    @JsonProperty("code")
    val code: String = "ACK_OK",

    @JsonProperty("amount")
    val amount: BigDecimal,

    @JsonProperty("message")
    val message: String = "Payment request accepted"
)
