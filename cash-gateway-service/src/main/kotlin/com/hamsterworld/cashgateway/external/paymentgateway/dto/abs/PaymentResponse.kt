package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import java.math.BigDecimal

/**
 * 모든 PG사 공통이라 간주
 */
interface PaymentResponse {
    /**
     * 응답 코드
     */
    fun getCode(): String

    /**
     * 거래 식별자 (PG Transaction)
     */
    fun getPgTransaction(): String?

    /**
     * 승인 번호
     */
    fun getPgApprovalNo(): String?

    /**
     * 응답 메시지
     */
    fun getMessage(): String

    /**
     * 거래 금액
     *
     * 외부 거래 기록 시 필요
     */
    fun getAmount(): BigDecimal?

    fun isSuccess(): Boolean {
        return false
    }
}
