package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

/**
 * 모든 PG사 공통 결제 요청
 *
 * 여기서의 MID는 **PG MID** (PG사에 등록된 실제 가맹점 ID).
 * Cash Gateway MID → PG MID 변환은 Provider 내부에서 수행된 후 이 요청에 담김.
 */
interface PaymentRequest {
    /**
     * PG MID (PG사에 등록된 실제 가맹점 ID)
     *
     * Cash Gateway MID와 다름:
     * - Cash Gateway MID: Cash Gateway가 발급한 가맹점 식별자 (예: CGW_MID_001)
     * - PG MID: PG사에 등록된 실제 가맹점 ID (예: hamster_dummy_mid_001)
     */
    fun getMid(): String

    /**
     * 결제 금액
     */
    fun getAmount(): BigDecimal

    fun getRequestType(): PaymentStatus
}
