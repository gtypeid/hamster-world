package com.hamsterworld.hamsterpg.app.paymentprocess.request

import java.math.BigDecimal

/**
 * Cash Gateway에서 오는 결제 처리 요청
 *
 * Cash Gateway의 DummyPaymentRequest와 매칭됨.
 * midId를 통해 어떤 가맹점이 요청했는지 식별하고,
 * 해당 MID에 등록된 webhookUrl로 결과를 노티한다.
 */
data class ProcessPaymentRequest(
    val midId: String,
    val userId: String?,
    val orderId: String,
    val amount: BigDecimal,
    val echo: Map<String, Any?> = emptyMap()  // orderNumber, gatewayReferenceId 등 포함
)
