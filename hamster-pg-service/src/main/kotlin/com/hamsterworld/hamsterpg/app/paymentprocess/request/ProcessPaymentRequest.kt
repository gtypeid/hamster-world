package com.hamsterworld.hamsterpg.app.paymentprocess.request

import java.math.BigDecimal

/**
 * Cash Gateway에서 오는 결제 처리 요청
 *
 * Cash Gateway의 DummyPaymentRequest와 매칭됨
 */
data class ProcessPaymentRequest(
    val userPublicId: String?,
    val orderId: String,
    val amount: BigDecimal,
    val echo: Map<String, Any?> = emptyMap()  // mid, orderNumber, gatewayReferenceId 포함
)
