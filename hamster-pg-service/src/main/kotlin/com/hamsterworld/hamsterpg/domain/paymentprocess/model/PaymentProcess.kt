package com.hamsterworld.hamsterpg.domain.paymentprocess.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.hamsterpg.domain.paymentprocess.constant.PaymentProcessStatus
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * PG 처리 프로세스
 *
 * Cash Gateway로부터 요청을 받아 처리하는 트랜잭션 이력
 * - PENDING: 요청 접수
 * - PROCESSING: 폴링 스케줄러가 처리 시작
 * - SUCCESS/FAILED: 최종 결과
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
class PaymentProcess(
    @Column(nullable = false, unique = true, length = 100)
    val tid: String,  // Transaction ID (PG 내부 트랜잭션 ID)

    @Column(name = "order_id", nullable = false)
    val orderId: String,  // 주문 ID (Cash Gateway의 orderNumber)

    @Column(name = "user_public_id", length = 20)
    val userPublicId: String?,

    @Column(nullable = false, precision = 15, scale = 3)
    val amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: PaymentProcessStatus = PaymentProcessStatus.PENDING,

    @Column(name = "approval_no", length = 50)
    var approvalNo: String? = null,  // 승인번호 (성공 시)

    @Column(name = "fail_reason")
    var failReason: String? = null,  // 실패 사유

    @Column(columnDefinition = "JSON")
    val echo: String? = null,  // Cash Gateway가 보낸 메타데이터 (mid, orderNumber, gatewayReferenceId 포함)

    @Column(name = "webhook_url", nullable = false, length = 500)
    var webhookUrl: String = "http://127.0.0.1:8082/api/webhook/pg/DUMMY",  // Webhook URL

    @Column(name = "webhook_sent_at")
    var webhookSentAt: LocalDateTime? = null,  // Webhook 전송 시각

    @Column(name = "webhook_response_code")
    var webhookResponseCode: Int? = null,  // Webhook 응답 코드

    @Column(name = "requested_at", nullable = false)
    val requestedAt: LocalDateTime = LocalDateTime.now(),  // 요청 접수 시각

    @Column(name = "processing_started_at")
    var processingStartedAt: LocalDateTime? = null,  // 처리 시작 시각 (PROCESSING 상태 진입 시)

    @Column(name = "processed_at")
    var processedAt: LocalDateTime? = null  // 최종 처리 시각 (SUCCESS/FAILED)

) : AbsDomain() {

    /**
     * 처리 시작 (PENDING → PROCESSING)
     */
    fun startProcessing() {
        this.status = PaymentProcessStatus.PROCESSING
        this.processingStartedAt = LocalDateTime.now()
    }

    /**
     * 승인 완료 (PROCESSING → SUCCESS)
     */
    fun markSuccess(approvalNo: String) {
        this.status = PaymentProcessStatus.SUCCESS
        this.approvalNo = approvalNo
        this.processedAt = LocalDateTime.now()
    }

    /**
     * 실패 처리 (PROCESSING → FAILED)
     */
    fun markFailed(reason: String) {
        this.status = PaymentProcessStatus.FAILED
        this.failReason = reason
        this.processedAt = LocalDateTime.now()
    }

    /**
     * Webhook 전송 완료 마킹
     */
    fun markWebhookSent(responseCode: Int) {
        this.webhookSentAt = LocalDateTime.now()
        this.webhookResponseCode = responseCode
    }
}
