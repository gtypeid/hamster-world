package com.hamsterworld.hamsterpg.domain.payment.constant

/**
 * Payment 상태
 *
 * Payment는 유의미한 거래 결과만 기록하므로,
 * 상태는 COMPLETED 또는 FAILED만 존재한다.
 */
enum class PaymentStatus {
    COMPLETED,
    FAILED
}
