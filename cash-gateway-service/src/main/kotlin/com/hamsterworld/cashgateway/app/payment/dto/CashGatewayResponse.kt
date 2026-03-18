package com.hamsterworld.cashgateway.app.payment.dto

data class CashGatewayResponse(
    val success: Boolean,
    val message: String,
    val orderPublicId: String? = null,
    val attemptPublicId: String? = null
)
