package com.hamsterworld.hamsterpg.domain.paymentprocess.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessFailedEvent
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessSucceededEvent
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Entity
@Table(
    name = "payment_processes",
    indexes = [
        Index(name = "idx_payment_processes_tid", columnList = "tid", unique = true),
        Index(name = "idx_payment_processes_status", columnList = "status"),
        Index(name = "idx_payment_processes_order_id", columnList = "order_id")
    ]
)
class PaymentProcess private constructor(
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: PaymentProcessStatus = PaymentProcessStatus.PENDING,

    @Column(name = "approval_no", length = 50)
    var approvalNo: String? = null,

    @Column(name = "fail_reason")
    var failReason: String? = null,

    @Column(columnDefinition = "JSON")
    val echo: String? = null,

    @Column(name = "requested_at", nullable = false)
    val requestedAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "processing_started_at")
    var processingStartedAt: LocalDateTime? = null,

    @Column(name = "processed_at")
    var processedAt: LocalDateTime? = null

) : AbsDomain() {

    companion object {
        private val DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd")

        fun create(
            midId: String,
            orderId: String,
            userId: String?,
            amount: BigDecimal,
            echo: String?
        ): PaymentProcess {
            return PaymentProcess(
                tid = generateTid(),
                midId = midId,
                orderId = orderId,
                userId = userId,
                amount = amount,
                status = PaymentProcessStatus.PENDING,
                echo = echo,
                requestedAt = LocalDateTime.now()
            )
        }

        private fun generateTid(): String {
            val dateStr = LocalDateTime.now().format(DATE_FORMAT)
            val randomStr = (10000000..99999999).random()
            return "DUMMY_${dateStr}_${randomStr}"
        }
    }

    fun registerSuccessEvent(approvalNo: String): PaymentProcess {
        this.status = PaymentProcessStatus.SUCCESS
        this.approvalNo = approvalNo
        registerEvent(InternalPaymentProcessSucceededEvent(process = this))
        return this
    }

    fun registerFailedEvent(reason: String): PaymentProcess {
        this.status = PaymentProcessStatus.FAILED
        this.failReason = reason
        registerEvent(InternalPaymentProcessFailedEvent(process = this, reason = reason))
        return this
    }
}
