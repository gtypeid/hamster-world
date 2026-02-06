package com.hamsterworld.cashgateway.domain.paymentprocess.constant

/**
 * PaymentProcess 상태
 *
 * UNKNOWN: 생성됨, PG 요청 전
 * PENDING: PG 요청 완료, 응답 대기 중 (중복 요청 방지)
 * SUCCESS: 최종 승인
 * FAILED: 최종 실패
 * CANCELLED: 취소
 */
enum class PaymentProcessStatus {
    UNKNOWN,    // 생성됨, PG 요청 전
    PENDING,    // PG 요청 완료, 응답 대기 중
    SUCCESS,    // 최종 승인
    FAILED,     // 최종 실패
    CANCELLED   // 취소
}
