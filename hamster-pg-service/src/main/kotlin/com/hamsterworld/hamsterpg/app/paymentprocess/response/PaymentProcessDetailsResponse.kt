package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import java.math.BigDecimal
import java.time.LocalDateTime

data class PaymentProcessDetailsResponse(
    val tid: String,
    val midId: String,
    val orderId: String,
    val amount: BigDecimal,
    val status: PaymentProcessStatus,
    val approvalNo: String?,
    val failReason: String?,
    val requestedAt: LocalDateTime,
    val processingStartedAt: LocalDateTime?,
    val processedAt: LocalDateTime?
) {
    companion object {
        fun from(process: PaymentProcess): PaymentProcessDetailsResponse {
            return PaymentProcessDetailsResponse(
                tid = process.tid,
                midId = process.midId,
                orderId = process.orderId,
                amount = process.amount,
                status = process.status,
                approvalNo = process.approvalNo,
                failReason = process.failReason,
                requestedAt = process.requestedAt,
                processingStartedAt = process.processingStartedAt,
                processedAt = process.processedAt
            )
        }
    }
}
