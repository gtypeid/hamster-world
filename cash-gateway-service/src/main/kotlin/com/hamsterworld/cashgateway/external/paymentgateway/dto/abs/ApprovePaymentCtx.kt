package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

class ApprovePaymentCtx(
    userKeycloakId: String,
    orderPublicId: String,
    orderNumber: String,
    amount: BigDecimal,
    cashGatewayMid: String
) : PaymentCtx(PaymentStatus.APPROVED, userKeycloakId, orderPublicId, orderNumber, amount, cashGatewayMid)
