package com.hamsterworld.cashgateway.app.paymentprocess.response

import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * PaymentProcess 응답 DTO
 *
 * 외부로 노출되는 PaymentProcess 정보
 * - 내부 PK (originProcessId: Long)는 노출하지 않음
 * - Public ID (originProcessPublicId: String)만 노출
 */
data class PaymentProcessResponse(
    val publicId: String,
    val orderPublicId: String?,
    val userKeycloakId: String,
    val orderNumber: String?,
    val provider: Provider?,
    val cashGatewayMid: String,
    val amount: BigDecimal,
    val status: PaymentProcessStatus,
    val gatewayReferenceId: String,
    val code: String?,
    val message: String?,
    val pgTransaction: String?,
    val pgApprovalNo: String?,
    val originProcessPublicId: String?,
    val originSource: String?,
    val requestPayload: String?,
    val responsePayload: String?,
    val requestedAt: LocalDateTime?,
    val ackReceivedAt: LocalDateTime?,
    val lastRequestAttemptAt: LocalDateTime?,
    val requestAttemptCount: Int,
    val lastHttpStatusCode: String?,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(process: PaymentProcess, originProcessPublicId: String?): PaymentProcessResponse {
            return PaymentProcessResponse(
                publicId = process.publicId,
                orderPublicId = process.orderPublicId,
                userKeycloakId = process.userKeycloakId,
                orderNumber = process.orderNumber,
                provider = process.provider,
                cashGatewayMid = process.cashGatewayMid,
                amount = process.amount,
                status = process.status,
                gatewayReferenceId = process.gatewayReferenceId,
                code = process.code,
                message = process.message,
                pgTransaction = process.pgTransaction,
                pgApprovalNo = process.pgApprovalNo,
                originProcessPublicId = originProcessPublicId,
                originSource = process.originSource,
                requestPayload = process.requestPayload,
                responsePayload = process.responsePayload,
                requestedAt = process.requestedAt,
                ackReceivedAt = process.ackReceivedAt,
                lastRequestAttemptAt = process.lastRequestAttemptAt,
                requestAttemptCount = process.requestAttemptCount,
                lastHttpStatusCode = process.lastHttpStatusCode,
                createdAt = process.createdAt,
                modifiedAt = process.modifiedAt
            )
        }
    }
}
