package com.hamsterworld.payment.domain.payment.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.payment.domain.payment.constant.PaymentStatus
import com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent
import com.hamsterworld.payment.domain.payment.event.PaymentCancelConfirmedEvent
import com.hamsterworld.payment.domain.payment.event.PaymentConfirmedEvent
import jakarta.persistence.*
import java.math.BigDecimal

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
    var processPublicId: String,

    @Column(name = "gateway_payment_public_id", length = 20, nullable = false)
    var gatewayPaymentPublicId: String,

    @Column(name = "gateway_mid", length = 100, nullable = false)
    var gatewayMid: String,

    @Column(name = "order_public_id", length = 20, nullable = false)
    var orderPublicId: String,

    @Column(name = "order_snapshot_id", nullable = false)
    var orderSnapshotId: Long,

    @Column(name = "amount", nullable = false, precision = 15, scale = 3)
    var amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: PaymentStatus,

    @Column(name = "pg_transaction", length = 255)
    var pgTransaction: String?,

    @Column(name = "pg_approval_no", length = 255)
    var pgApprovalNo: String?,

    @Column(name = "origin_payment_id")
    var originPaymentId: Long? = null
) : AbsDomain() {

    companion object {

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
                status = PaymentStatus.APPROVED,
                pgTransaction = pgTransaction,
                pgApprovalNo = pgApprovalNo,
                originPaymentId = null
            )

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

        fun createCancelled(
            processPublicId: String,
            gatewayPaymentPublicId: String,
            gatewayMid: String,
            orderPublicId: String,
            orderSnapshotId: Long,
            amount: BigDecimal,
            pgTransaction: String?,
            pgApprovalNo: String?,
            originPaymentId: Long,
            originPaymentPublicId: String
        ): Payment {
            val payment = Payment(
                processPublicId = processPublicId,
                gatewayPaymentPublicId = gatewayPaymentPublicId,
                gatewayMid = gatewayMid,
                orderPublicId = orderPublicId,
                orderSnapshotId = orderSnapshotId,
                amount = amount,
                status = PaymentStatus.CANCELLED,
                pgTransaction = pgTransaction,
                pgApprovalNo = pgApprovalNo,
                originPaymentId = originPaymentId
            )

            payment.registerEvent(
                InternalStockRestoreEvent(
                    orderPublicId = payment.orderPublicId,
                    orderSnapshotId = payment.orderSnapshotId,
                    reason = "[결제 취소 복원] orderPublicId=${payment.orderPublicId}, paymentPublicId=${payment.publicId}"
                )
            )

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
