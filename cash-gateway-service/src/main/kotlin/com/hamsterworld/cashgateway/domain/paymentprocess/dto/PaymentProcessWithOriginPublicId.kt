package com.hamsterworld.cashgateway.domain.paymentprocess.dto

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess

/**
 * PaymentProcess + originProcessPublicId 조합 DTO
 *
 * Repository에서 반환용
 */
data class PaymentProcessWithOriginPublicId(
    val process: PaymentProcess,
    val originProcessPublicId: String?
)
