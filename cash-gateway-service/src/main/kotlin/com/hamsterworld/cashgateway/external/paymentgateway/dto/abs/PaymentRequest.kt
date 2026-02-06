package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

/**
 * 모든 PG사 공통이라 간주
 */
interface PaymentRequest {
    /**
     * 결제 금액
     */
    fun getAmount(): BigDecimal

    fun getRequestType(): PaymentStatus
}
