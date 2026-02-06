package com.hamsterworld.payment.domain.payment.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent
import com.hamsterworld.payment.domain.payment.event.PaymentCancelConfirmedEvent
import com.hamsterworld.payment.domain.payment.event.PaymentConfirmedEvent
import jakarta.persistence.*
import java.math.BigDecimal

/**
 * Payment 엔티티 (Business Truth)
 *
 * ## 설계 철학
 * - Cash Gateway의 PaymentProcess (Communication Truth)와 분리
 * - Payment Service에서 Payment + Stock + OrderSnapshot을 같은 트랜잭션으로 관리
 * - OrderSnapshot과 한 몸이어야 하므로 Payment Service에 위치
 *
 * ## 특징
 * - 완전 불변 (INSERT만, UPDATE 없음)
 * - processPublicId로 Cash Gateway의 PaymentProcess 참조 (논리적 FK)
 * - gatewayPaymentPublicId로 Cash Gateway의 Payment 참조 (방화벽 원천 추적)
 * - gatewayMid로 어느 채널로 처리되었는지 추적 가능
 * - Stock, OrderSnapshot과 같은 트랜잭션 → 원자성 보장
 *
 * ## 필드 정책
 * - orderPublicId: Ecommerce Service의 Order 참조 (Cross-Service, String)
 * - orderSnapshotId: Payment Service 내부의 OrderSnapshot 참조 (Internal, Long)
 * - 양쪽 다 보유: 외부 식별 + 내부 트랜잭션 원자성
 */
@Entity
@Table(
    name = "payments",
    indexes = [
        Index(name = "idx_payments_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_payments_process_public_id", columnList = "process_public_id"),
        Index(name = "idx_payments_gateway_payment_public_id", columnList = "gateway_payment_public_id"),
        Index(name = "idx_payments_order_public_id", columnList = "order_public_id"),
        Index(name = "idx_payments_order_snapshot_id", columnList = "order_snapshot_id"),
        Index(name = "idx_payments_pg_transaction", columnList = "pg_transaction", unique = true)
    ]
)
class Payment(
    @Column(name = "process_public_id", length = 20, nullable = false)
    var processPublicId: String,  // Cash Gateway PaymentProcess 참조

    @Column(name = "gateway_payment_public_id", length = 20, nullable = false)
    var gatewayPaymentPublicId: String,  // Cash Gateway Payment 참조 (방화벽 원천)

    @Column(name = "gateway_mid", length = 100, nullable = false)
    var gatewayMid: String,  // Cash Gateway MID (어느 채널로 처리되었는지)

    @Column(name = "order_public_id", length = 20, nullable = false)
    var orderPublicId: String,  // Ecommerce Order 참조 (외부 식별)

    @Column(name = "order_snapshot_id", nullable = false)
    var orderSnapshotId: Long,  // OrderSnapshot FK (내부 트랜잭션)

    @Column(name = "amount", nullable = false, precision = 15, scale = 3)
    var amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PaymentStatus,  // APPROVED, CANCELLED

    @Column(name = "pg_transaction", length = 255)
    var pgTransaction: String?,  // PG 거래번호 (참고용, 추적용)

    @Column(name = "pg_approval_no", length = 255)
    var pgApprovalNo: String?,  // PG 승인번호 (참고용)

    @Column(name = "origin_payment_id")
    var originPaymentId: Long? = null  // 취소건이면 원본 Payment 참조
) : AbsDomain() {

    companion object {
        /**
         * 결제 승인 Payment 생성 (팩토리 메서드)
         *
         * ## 비즈니스 규칙
         * - status = APPROVED (자동 설정)
         * - originPaymentId = null (승인건은 원본 없음)
         * - PaymentConfirmedEvent 자동 등록
         *
         * @return Payment (이벤트 등록됨)
         */
        fun createApproved(
            processPublicId: String,
            gatewayPaymentPublicId: String,
            gatewayMid: String,
            orderPublicId: String,
            orderSnapshotId: Long,
            amount: BigDecimal,
            pgTransaction: String?,
            pgApprovalNo: String?
        ): Payment {
            val payment = Payment(
                processPublicId = processPublicId,
                gatewayPaymentPublicId = gatewayPaymentPublicId,
                gatewayMid = gatewayMid,
                orderPublicId = orderPublicId,
                orderSnapshotId = orderSnapshotId,
                amount = amount,
                status = PaymentStatus.APPROVED,  // 자동 설정
                pgTransaction = pgTransaction,
                pgApprovalNo = pgApprovalNo,
                originPaymentId = null  // 승인건은 원본 없음
            )

            // PaymentConfirmedEvent 등록
            payment.registerEvent(
                PaymentConfirmedEvent(
                    paymentPublicId = payment.publicId,
                    orderPublicId = payment.orderPublicId,
                    amount = payment.amount,
                    status = PaymentStatus.APPROVED,
                    gatewayPaymentPublicId = payment.gatewayPaymentPublicId
                )
            )

            return payment
        }

        /**
         * 결제 취소 Payment 생성 (팩토리 메서드)
         *
         * ## 비즈니스 규칙
         * - status = CANCELLED (자동 설정)
         * - originPaymentId = 필수 (취소건은 원본 Payment 참조 필수)
         * - InternalStockRestoreEvent 자동 등록 (재고 복원)
         * - PaymentCancelConfirmedEvent 자동 등록 (Ecommerce 알림)
         *
         * ## 이벤트 발행 순서 (중요!)
         * 1. InternalStockRestoreEvent (동기 실행, 재고 복원)
         * 2. PaymentCancelConfirmedEvent (Kafka 발행, Ecommerce 알림)
         *
         * @param originPaymentId 원본 결제 ID (필수)
         * @param originPaymentPublicId 원본 Payment Public ID (필수, 이벤트 전달용)
         * @return Payment (이벤트 등록됨)
         */
        fun createCancelled(
            processPublicId: String,
            gatewayPaymentPublicId: String,
            gatewayMid: String,
            orderPublicId: String,
            orderSnapshotId: Long,
            amount: BigDecimal,
            pgTransaction: String?,
            pgApprovalNo: String?,
            originPaymentId: Long,  // 필수
            originPaymentPublicId: String  // 필수 (이벤트 전달용)
        ): Payment {
            val payment = Payment(
                processPublicId = processPublicId,
                gatewayPaymentPublicId = gatewayPaymentPublicId,
                gatewayMid = gatewayMid,
                orderPublicId = orderPublicId,
                orderSnapshotId = orderSnapshotId,
                amount = amount,
                status = PaymentStatus.CANCELLED,  // 자동 설정
                pgTransaction = pgTransaction,
                pgApprovalNo = pgApprovalNo,
                originPaymentId = originPaymentId  // 필수
            )

            // 1. InternalStockRestoreEvent 등록 (먼저 실행되어야 함)
            payment.registerEvent(
                InternalStockRestoreEvent(
                    orderPublicId = payment.orderPublicId,
                    orderSnapshotId = payment.orderSnapshotId,
                    reason = "[결제 취소 복원] orderPublicId=${payment.orderPublicId}, paymentPublicId=${payment.publicId}"
                )
            )

            // 2. PaymentCancelConfirmedEvent 등록 (Ecommerce 알림)
            payment.registerEvent(
                PaymentCancelConfirmedEvent(
                    paymentPublicId = payment.publicId,
                    orderPublicId = payment.orderPublicId,
                    amount = payment.amount,
                    originPaymentPublicId = originPaymentPublicId,
                    status = PaymentStatus.CANCELLED
                )
            )

            return payment
        }
    }
}
