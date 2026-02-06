package com.hamsterworld.payment.domain.payment.constant

/**
 * Payment 상태
 *
 * **특징**:
 * - APPROVED: 결제 승인 완료 (실제 돈의 흐름 발생)
 * - CANCELLED: 결제 취소 완료 (환불 완료)
 *
 * **주의**:
 * - 실패한 결제는 Payment로 표현하지 않음 (PaymentProcess의 책임)
 * - Payment는 성공 및 성공에 대한 취소만 존재
 */
enum class PaymentStatus {
    APPROVED,   // 결제 승인 완료
    CANCELLED   // 결제 취소 완료
}
