package com.hamsterworld.cashgateway.domain.paymentprocess.model

import com.hamsterworld.cashgateway.domain.payment.event.PaymentProcessCreatedEvent
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.domain.abs.AbsDomain
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
    name = "payment_processes",
    indexes = [
        Index(name = "idx_payment_processes_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_pg_transaction", columnList = "pgTransaction", unique = true),
        Index(name = "idx_payment_processes_order_public_id", columnList = "order_public_id"),
        Index(name = "idx_provider_mid_status", columnList = "provider,mid,status")
    ]
)
class PaymentProcess(
    @Column(name = "order_public_id", length = 20)
    var orderPublicId: String?,  // nullable (외부 거래는 NULL) - Order의 Public ID (Snowflake Base62)

    @Column(name = "user_public_id", length = 20)
    var userPublicId: String?,  // nullable (외부 거래는 NULL) - User의 Public ID (Snowflake Base62)

    var orderNumber: String? = null,  // nullable (주문 번호)

    @Enumerated(EnumType.STRING)
    var provider: Provider?,  // nullable

    var mid: String,  // MID (Merchant ID)

    var amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    var status: PaymentProcessStatus,

    var originProcessId: Long? = null,

    var gatewayReferenceId: String, // Cash Gateway 고유 거래 식별자

    var code: String? = null,

    var message: String? = null,

    var pgTransaction: String? = null,  // 멱등성 키 (PG tid or externalTxnId)

    var pgApprovalNo: String? = null,

    var activeRequestKey: String? = null,

    // 외부 거래 관련 필드
    var originSource: String? = null,  // null = 내부, "partner-a" = 외부

    @Column(columnDefinition = "json")
    var requestPayload: String? = null,  // 외부 거래는 null (요청을 알 수 없음)

    @Column(columnDefinition = "json")
    var responsePayload: String? = null,

    // 운영 메타데이터 필드
    @Column(name = "requested_at")
    var requestedAt: LocalDateTime? = null,  // PG 요청 시작 시각

    @Column(name = "ack_received_at")
    var ackReceivedAt: LocalDateTime? = null,  // PG 202/200 응답 받은 시각

    @Column(name = "last_request_attempt_at")
    var lastRequestAttemptAt: LocalDateTime? = null,  // 마지막 재시도 시각

    @Column(name = "request_attempt_count")
    var requestAttemptCount: Int = 0,  // 총 요청 시도 횟수

    @Column(name = "last_pg_response_code", length = 10)
    var lastPgResponseCode: String? = null  // 마지막 PG 응답 코드 (202, 200 등)
) : AbsDomain() {
    /**
     * PaymentProcess 생성 시 이벤트 등록
     *
     * PG 요청 기록 완료 후 호출되어 PaymentProcessCreatedEvent를 등록합니다.
     * repository.save() 시 자동으로 이벤트가 발행됩니다.
     *
     * @return this
     */
    fun onCreate(): PaymentProcess {
        registerEvent(PaymentProcessCreatedEvent(this))
        return this
    }

    // Helper methods
    fun isExternal(): Boolean = (originSource != null)
    fun isInternal(): Boolean = (originSource == null)

    companion object {
        /**
         * gatewayReferenceId 자동 생성
         *
         * **목적**: Webhook에서 UNKNOWN PaymentAttempt를 찾기 위한 고유 식별자
         * - tid는 PG 응답 후에만 알 수 있음 (UNKNOWN 상태엔 없음)
         * - Provider + MID만으론 동시 요청 시 유일성 보장 안됨
         * - PG 요청 시 생성 → PG에 전달 → Webhook에서 다시 받아서 매칭
         *
         * **형식**: CGW_{PROVIDER}_{MID}_{TIMESTAMP}_{RANDOM}
         * **예시**: CGW_DUMMY_CGW_MID_001_20260201123045_a1b2c3d4
         *
         * **사용처**: DomainConverter에서 PaymentAttempt 생성 시 호출
         */
        fun generateGatewayReferenceId(
            provider: Provider?,
            mid: String
        ): String {
            val providerName = provider?.name ?: "EXTERNAL"
            val timestamp = java.time.LocalDateTime.now()
            val dateTime = timestamp.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
            val random = java.util.UUID.randomUUID().toString().substring(0, 8).uppercase()
            return "CGW_${providerName}_${mid}_${dateTime}_${random}"
        }
    }
}
