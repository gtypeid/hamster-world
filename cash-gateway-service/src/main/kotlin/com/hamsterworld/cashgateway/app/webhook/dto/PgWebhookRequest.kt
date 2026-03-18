package com.hamsterworld.cashgateway.app.webhook.dto

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

data class PgWebhookRequest(
    val pgTransaction: String,
    val approvalNo: String? = null,
    val amount: BigDecimal,
    val status: String,
    val orderNumber: String? = null,
    val code: String? = null,
    val message: String? = null,
    val rawPayload: Map<String, Any>? = null
)

data class PgWebhookResponse(
    val success: Boolean,
    val message: String? = null,
    val paymentId: Long? = null
)
