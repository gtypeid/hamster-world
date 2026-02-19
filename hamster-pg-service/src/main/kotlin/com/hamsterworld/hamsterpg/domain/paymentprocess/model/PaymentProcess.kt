package com.hamsterworld.hamsterpg.domain.paymentprocess.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessFailedEvent
import com.hamsterworld.hamsterpg.domain.paymentprocess.event.InternalPaymentProcessSucceededEvent
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * PG 처리 프로세스 (Aggregate Root)
 *
 * 외부(Cash Gateway)로부터 거래 요청을 접수하고 비동기로 처리하는 트랜잭션 이력.
 * 거래 시도 자체를 기록하며, 유의미한 결과(성공/실패)는 InternalEvent를 통해
 * Payment 생성 및 Notification 발송을 트리거한다.
 *
 * 상태 흐름: PENDING → PROCESSING → SUCCESS / FAILED
 */
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

        /**
         * 거래 요청 접수 (PENDING 상태로 생성)
         *
         * @param midId 가맹점 ID (어떤 가맹점의 거래인지 식별)
         */
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

    /**
     * 성공 이벤트 등록
     *
     * CAS로 DB 상태 전이(PROCESSING → SUCCESS) 완료 후 호출.
     * CAS bulk update는 영속성 컨텍스트를 우회하므로,
     * 메모리 상의 엔티티도 최신 값으로 동기화한 뒤 이벤트를 등록한다.
     */
    fun registerSuccessEvent(approvalNo: String): PaymentProcess {
        this.status = PaymentProcessStatus.SUCCESS
        this.approvalNo = approvalNo
        registerEvent(InternalPaymentProcessSucceededEvent(process = this))
        return this
    }

    /**
     * 실패 이벤트 등록
     *
     * CAS로 DB 상태 전이(PROCESSING → FAILED) 완료 후 호출.
     * CAS bulk update는 영속성 컨텍스트를 우회하므로,
     * 메모리 상의 엔티티도 최신 값으로 동기화한 뒤 이벤트를 등록한다.
     */
    fun registerFailedEvent(reason: String): PaymentProcess {
        this.status = PaymentProcessStatus.FAILED
        this.failReason = reason
        registerEvent(InternalPaymentProcessFailedEvent(process = this, reason = reason))
        return this
    }
}
