package com.hamsterworld.hamsterpg.domain.payment.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.hamsterpg.domain.payment.constant.NotificationStatus
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
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
        Index(name = "idx_payments_tid", columnList = "tid", unique = true)
    ]
)
class Payment(
    @Column(nullable = false)
    var midId: String,

    @Column(name = "order_public_id", nullable = false, length = 20)
    var orderPublicId: String,

    @Column(nullable = false, precision = 19, scale = 2)
    var amount: BigDecimal,

    @Column(nullable = false)
    var callbackUrl: String,

    @Column(columnDefinition = "TEXT")
    var echo: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PaymentStatus = PaymentStatus.PENDING,

    var approvalNo: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var notificationStatus: NotificationStatus = NotificationStatus.NOT_SENT,

    @Column(nullable = false)
    var notificationAttemptCount: Int = 0,

    var lastNotificationAt: LocalDateTime? = null,

    @Column(columnDefinition = "TEXT")
    var notificationErrorMessage: String? = null,

    var failureReason: String? = null,

    var processedAt: LocalDateTime? = null
) : AbsDomain() {

    @Column(unique = true, nullable = false)
    var tid: String = publicId  // Use publicId as tid

    /**
     * 결제 취소 요청
     */
    fun requestCancel(): Payment {
        this.status = PaymentStatus.CANCEL_PENDING
        return this
    }

    /**
     * 결제 취소 완료
     */
    fun cancel(reason: String = "Cancelled by user"): Payment {
        this.status = PaymentStatus.CANCELLED
        this.failureReason = reason
        this.processedAt = LocalDateTime.now()
        return this
    }

    /**
     * 결제 승인 완료
     */
    fun complete(approvalNo: String = tid): Payment {
        this.status = PaymentStatus.COMPLETED
        this.approvalNo = approvalNo
        this.processedAt = LocalDateTime.now()
        return this
    }

    /**
     * 결제 실패
     */
    fun fail(reason: String): Payment {
        this.status = PaymentStatus.FAILED
        this.failureReason = reason
        this.processedAt = LocalDateTime.now()
        return this
    }

    /**
     * 알림 전송 완료/실패 마킹
     * @param errorMessage null이면 성공, 값이 있으면 실패
     */
    fun markNotificationSent(errorMessage: String?): Payment {
        if (errorMessage == null) {
            this.notificationStatus = NotificationStatus.SENT
        } else {
            this.notificationStatus = NotificationStatus.FAILED
            this.notificationErrorMessage = errorMessage
        }
        this.lastNotificationAt = LocalDateTime.now()
        this.notificationAttemptCount++
        return this
    }
}
