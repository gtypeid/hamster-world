package com.hamsterworld.ecommerce.consumer
import java.math.BigDecimal
data class PaymentApprovedEventDto(
    val paymentPublicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String?,
    val provider: String,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,
    val originSource: String
)
data class PaymentFailedEventDto(
    val attemptPublicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String?,
    val provider: String?,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val code: String?,
    val message: String?,
    val reason: String?,
    val originSource: String
)
data class PaymentCancelledEventDto(
    val paymentPublicId: String,
    val originPaymentPublicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String?,
    val provider: String,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val pgTransaction: String,
    val pgApprovalNo: String,
    val gatewayPaymentPublicId: String,
    val originSource: String
)
