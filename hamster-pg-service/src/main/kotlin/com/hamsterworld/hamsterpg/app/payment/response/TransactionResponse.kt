package com.hamsterworld.hamsterpg.app.payment.response

import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import java.math.BigDecimal
import java.time.LocalDateTime

data class TransactionResponse(
    val tid: String,
    val orderId: String,
    val amount: BigDecimal,
    val status: PaymentStatus,
    val approvalNo: String?,
    val failureReason: String?,
    val notificationStatus: NotificationStatus,
    val notificationAttemptCount: Int,
    val lastNotificationAt: LocalDateTime?,
    val processedAt: LocalDateTime,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(payment: Payment): TransactionResponse {
            return TransactionResponse(
                tid = payment.tid,
                orderId = payment.orderId,
                amount = payment.amount,
                status = payment.status,
                approvalNo = payment.approvalNo,
                failureReason = payment.failureReason,
                notificationStatus = payment.notificationStatus,
                notificationAttemptCount = payment.notificationAttemptCount,
                lastNotificationAt = payment.lastNotificationAt,
                processedAt = payment.processedAt,
                createdAt = payment.createdAt,
                modifiedAt = payment.modifiedAt
            )
        }
    }
}
