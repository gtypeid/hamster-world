package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

class CancelPaymentCtx(
    userKeycloakId: String,
    orderPublicId: String,
    orderNumber: String,
    amount: BigDecimal,
    cashGatewayMid: String,
    val originTid: String
) : PaymentCtx(PaymentStatus.CANCELLED, userKeycloakId, orderPublicId, orderNumber, amount, cashGatewayMid)
