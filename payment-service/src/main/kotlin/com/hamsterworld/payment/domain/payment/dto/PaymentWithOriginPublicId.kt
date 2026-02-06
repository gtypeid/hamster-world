package com.hamsterworld.payment.domain.payment.dto

import com.hamsterworld.payment.domain.payment.model.Payment

/**
 * Payment + originPaymentPublicId 조합 DTO
 *
 * Repository에서 반환용
 */
data class PaymentWithOriginPublicId(
    val payment: Payment,
    val originPaymentPublicId: String?
)
