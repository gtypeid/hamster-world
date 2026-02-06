package com.hamsterworld.hamsterpg.domain.paymentprocess.constant

/**
 * PaymentProcess 상태 (Hamster PG Service)
 *
 * PENDING: 요청 접수됨, 처리 대기 중
 * PROCESSING: 처리 중 (폴링 스케줄러가 처리 시작)
 * SUCCESS: 승인 완료
 * FAILED: 실패
 */
enum class PaymentProcessStatus {
    PENDING,      // 요청 접수됨, 처리 대기 중
    PROCESSING,   // 처리 중 (폴링 스케줄러가 처리 시작)
    SUCCESS,      // 승인 완료
    FAILED        // 실패
}
