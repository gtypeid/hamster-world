package com.hamsterworld.hamsterpg.domain.payment.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.model.PaymentProcess
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "payments",
    indexes = [
        Index(name = "idx_payments_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_payments_tid", columnList = "tid", unique = true),
        Index(name = "idx_payments_order_id", columnList = "order_id")
    ]
)
class Payment private constructor(
    @Column(nullable = false, unique = true, length = 100)
    val tid: String,

    @Column(name = "mid_id", nullable = false, length = 100)
    val midId: String,

    @Column(name = "order_id", nullable = false)
    val orderId: String,

    @Column(name = "user_id", length = 100)
    val userId: String?,

    @Column(nullable = false, precision = 15, scale = 3)
    val amount: BigDecimal,

    @Column(columnDefinition = "JSON")
    val echo: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val status: PaymentStatus,

    @Column(name = "approval_no", length = 50)
    val approvalNo: String? = null,

    @Column(name = "failure_reason")
    val failureReason: String? = null,

    @Column(name = "processed_at", nullable = false)
    val processedAt: LocalDateTime,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var notificationStatus: NotificationStatus = NotificationStatus.NOT_SENT,

    @Column(nullable = false)
    var notificationAttemptCount: Int = 0,

    @Column(name = "last_notification_at")
    var lastNotificationAt: LocalDateTime? = null,

    @Column(name = "notification_error_message", columnDefinition = "TEXT")
    var notificationErrorMessage: String? = null

) : AbsDomain() {

    companion object {

        fun fromSuccessProcess(process: PaymentProcess): Payment {
            return Payment(
                tid = process.tid,
                midId = process.midId,
                orderId = process.orderId,
                userId = process.userId,
                amount = process.amount,
                echo = process.echo,
                status = PaymentStatus.COMPLETED,
                approvalNo = process.approvalNo,
                processedAt = process.processedAt ?: LocalDateTime.now()
            )
        }

        fun fromFailedProcess(process: PaymentProcess): Payment {
            return Payment(
                tid = process.tid,
                midId = process.midId,
                orderId = process.orderId,
                userId = process.userId,
                amount = process.amount,
                echo = process.echo,
                status = PaymentStatus.FAILED,
                failureReason = process.failReason,
                processedAt = process.processedAt ?: LocalDateTime.now()
            )
        }
    }

    fun markNotificationSent(): Payment {
        this.notificationStatus = NotificationStatus.SENT
        this.lastNotificationAt = LocalDateTime.now()
        this.notificationAttemptCount++
        return this
    }

    fun markNotificationFailed(errorMessage: String): Payment {
        this.notificationStatus = NotificationStatus.FAILED
        this.notificationErrorMessage = errorMessage
        this.lastNotificationAt = LocalDateTime.now()
        this.notificationAttemptCount++
        return this
    }
}
