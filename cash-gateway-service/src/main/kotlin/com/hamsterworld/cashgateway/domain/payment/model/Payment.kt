package com.hamsterworld.cashgateway.domain.payment.model

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.payment.event.PaymentApprovedEvent
import com.hamsterworld.cashgateway.domain.payment.event.PaymentCancelledEvent
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal

/*
    실제로 돈의 흐름이 있었음을 증명하는 불변 기록
    그런데 실패한 결제는
    돈이 안 움직였고, 정산 대상도 아니고, 회계적으로도 아무 일도 안 일어남
    Payment로 표현하지 않는다 (성공 및 성공에 대한 취소만 존재함)

    결제 실패는 상태가 아니라 이벤트이며, PaymentProcess의 책임
 */
@Entity
@Table(
    name = "payments",
    indexes = [
        Index(name = "idx_payments_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_process_id", columnList = "processId"),
        Index(name = "idx_origin_payment_id", columnList = "originPaymentId")
    ]
)
class Payment(
    var processId: Long,  // PaymentProcess FK (1:1, NOT NULL)

    @jakarta.persistence.Column(name = "order_public_id", length = 20)
    var orderPublicId: String?,  // nullable (외부 거래) - Order의 Public ID (Snowflake Base62)

    @jakarta.persistence.Column(name = "user_public_id", length = 20)
    var userPublicId: String?,  // nullable (외부 거래) - User의 Public ID (Snowflake Base62)

    @Enumerated(EnumType.STRING)
    var provider: Provider,

    var mid: String,  // MID (Merchant ID)

    var amount: BigDecimal,

    var pgTransaction: String,  // NOT NULL (Payment 생성 = PG 응답 받음)

    var pgApprovalNo: String,  // NOT NULL (Payment 생성 = PG 응답 받음)

    var gatewayReferenceId: String,  // NOT NULL (Cash Gateway 고유 거래 식별자, PaymentProcess에서 자동 생성)

    @Enumerated(EnumType.STRING)
    var status: PaymentStatus,

    var originPaymentId: Long? = null,  // 취소건이면 원본 Payment 참조

    var originSource: String  // 거래 출처 (예: ECOMMERCE, PARTNER_A, DUMMY_WEBHOOK)
) : AbsDomain() {

    /**
     * 결제 승인 완료 시 이벤트 등록
     *
     * PaymentGatewayCoreService.createApprovePayment()에서 호출
     * - Payment 생성 후 save() 시 자동으로 PaymentApprovedEvent 발행
     */
    fun onCreate(): Payment {
        registerEvent(
            PaymentApprovedEvent.from(this, this.userPublicId)
        )
        return this
    }

    /**
     * 결제 취소 완료 시 이벤트 등록
     *
     * PaymentGatewayCoreService.createCancelPayment()에서 호출
     * - Payment 생성 후 save() 시 자동으로 PaymentCancelledEvent 발행
     */
    fun onCancel(originPaymentPublicId: String): Payment {
        registerEvent(
            PaymentCancelledEvent.from(this, originPaymentPublicId, this.userPublicId)
        )
        return this
    }

    // Helper methods
    fun isExternal(): Boolean = orderPublicId == null
    fun isInternal(): Boolean = orderPublicId != null
}
