package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

interface PaymentCancelRequest : PaymentRequest {
    fun getPgTransaction(): String

    fun getCancel(): String
}
