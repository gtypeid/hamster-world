package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

interface PaymentCancelRequest : PaymentRequest {
    /**
     * 결제 금액
     */
    fun getPgTransaction(): String

    fun getCancel(): String
}
