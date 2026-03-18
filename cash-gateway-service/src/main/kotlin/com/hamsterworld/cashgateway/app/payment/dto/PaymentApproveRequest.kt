package com.hamsterworld.cashgateway.app.payment.dto

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

data class PaymentApproveRequest(
    val orderPublicId: String,
    val userKeycloakId: String,
    val amount: BigDecimal,
    val provider: Provider,
    val orderNumber: String
)
