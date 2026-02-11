package com.hamsterworld.hamsterpg.app.paymentprocess.response

import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import java.math.BigDecimal
import java.time.LocalDateTime

data class PaymentProcessDetailsResponse(
    val tid: String,
    val orderId: String,
    val amount: BigDecimal,
    val status: PaymentProcessStatus,
    val approvalNo: String?,
    val failReason: String?,
    val requestedAt: LocalDateTime,
    val processedAt: LocalDateTime?,
    val webhookSentAt: LocalDateTime?
) {
    companion object {
        fun from(process: PaymentProcess): PaymentProcessDetailsResponse {
            return PaymentProcessDetailsResponse(
                tid = process.tid,
                orderId = process.orderId,
                amount = process.amount,
                status = process.status,
                approvalNo = process.approvalNo,
                failReason = process.failReason,
                requestedAt = process.requestedAt,
                processedAt = process.processedAt,
                webhookSentAt = process.webhookSentAt
            )
        }
    }
}
