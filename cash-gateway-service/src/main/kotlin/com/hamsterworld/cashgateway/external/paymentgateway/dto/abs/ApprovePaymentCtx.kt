package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

class ApprovePaymentCtx(
    userKeycloakId: String,    // User의 Keycloak Subject ID (외부 시스템 UUID)
    orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    orderNumber: String,
    amount: BigDecimal,
    cashGatewayMid: String    // Cash Gateway MID (Cash Gateway가 발급한 가맹점 식별자)
) : PaymentCtx(PaymentStatus.APPROVED, userKeycloakId, orderPublicId, orderNumber, amount, cashGatewayMid)
