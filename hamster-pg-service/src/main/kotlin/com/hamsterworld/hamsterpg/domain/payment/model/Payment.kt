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

/**
 * 결제 (유의미한 거래 결과)
 *
 * PaymentProcess의 CAS 처리를 통해 확정된 결과만 기록한다.
 * - 결제 성공 (승인, COMPLETED)
 * - 결제 실패 (거부, 금액부족, 도난카드 등 - 도메인적으로 유의미한 실패, FAILED)
 *
 * Payment는 반드시 PaymentProcessEventHandler를 통해서만 생성된다.
 * tid는 PaymentProcess의 tid를 그대로 사용한다.
 */
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

        /**
         * 승인 완료된 거래로부터 Payment 생성
         */
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

        /**
         * 실패한 거래로부터 Payment 생성
         * (거부, 금액부족, 도난카드 등 유의미한 도메인 결과)
         */
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

    /**
     * 노티 발송 완료 마킹
     *
     * 외부(Cash Gateway)의 응답과 무관하게 "발송했다"는 이력만 남긴다.
     */
    fun markNotificationSent(): Payment {
        this.notificationStatus = NotificationStatus.SENT
        this.lastNotificationAt = LocalDateTime.now()
        this.notificationAttemptCount++
        return this
    }

    /**
     * 노티 발송 실패 마킹
     */
    fun markNotificationFailed(errorMessage: String): Payment {
        this.notificationStatus = NotificationStatus.FAILED
        this.notificationErrorMessage = errorMessage
        this.lastNotificationAt = LocalDateTime.now()
        this.notificationAttemptCount++
        return this
    }
}
