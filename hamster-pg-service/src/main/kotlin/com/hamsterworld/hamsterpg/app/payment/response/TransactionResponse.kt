package com.hamsterworld.hamsterpg.app.payment.response

import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import java.math.BigDecimal
import java.time.LocalDateTime

data class TransactionResponse(
    val tid: String,
    val midId: String,
    val orderId: String,
    val amount: BigDecimal,
    val callbackUrl: String,
    val echo: String?,
    val status: PaymentStatus,
    val approvalNo: String?,
    val notificationStatus: NotificationStatus,
    val notificationAttemptCount: Int,
    val lastNotificationAt: LocalDateTime?,
    val failureReason: String?,
    val processedAt: LocalDateTime?,
    val createdAt: LocalDateTime?,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(payment: Payment): TransactionResponse {
            return TransactionResponse(
                tid = payment.tid,
                midId = payment.midId,
                orderId = payment.orderPublicId,
                amount = payment.amount,
                callbackUrl = payment.callbackUrl,
                echo = payment.echo,
                status = payment.status,
                approvalNo = payment.approvalNo,
                notificationStatus = payment.notificationStatus,
                notificationAttemptCount = payment.notificationAttemptCount,
                lastNotificationAt = payment.lastNotificationAt,
                failureReason = payment.failureReason,
                processedAt = payment.processedAt,
                createdAt = payment.createdAt,
                modifiedAt = payment.modifiedAt
            )
        }
    }
}
