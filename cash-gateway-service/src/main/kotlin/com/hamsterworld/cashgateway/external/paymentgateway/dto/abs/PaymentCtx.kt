package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

abstract class PaymentCtx(
    val paymentStatus: PaymentStatus,
    val userKeycloakId: String,
    val orderPublicId: String,
    val orderNumber: String,
    val amount: BigDecimal,
    val cashGatewayMid: String
)
