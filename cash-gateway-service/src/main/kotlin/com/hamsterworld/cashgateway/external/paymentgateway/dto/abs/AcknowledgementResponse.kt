package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

interface AcknowledgementResponse {
    fun getAckCode(): String?

    fun getAckMessage(): String?

    fun getPgTransaction(): String?

    fun isAcknowledged(): Boolean

    fun getRawPayload(): String? = null
}