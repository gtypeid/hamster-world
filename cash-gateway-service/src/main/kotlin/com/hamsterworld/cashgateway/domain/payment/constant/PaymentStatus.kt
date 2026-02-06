package com.hamsterworld.cashgateway.domain.payment.constant

/**
 * PG 요청 타입 구분
 *
 * ## 용도
 * - PaymentCtx에서 요청 타입 구분 (승인 vs 취소)
 * - Provider에서 요청 타입에 따라 다른 처리
 *
 * ## 주의사항
 * - 이것은 Cash Gateway의 Communication Truth 용도
 * - Payment Service의 Payment.status와는 다른 개념
 */
enum class PaymentStatus {
    APPROVED,   // 승인 요청
    CANCELLED   // 취소 요청
}
