package com.hamsterworld.cashgateway.app.webhook.dto

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import java.math.BigDecimal

/**
 * PG Webhook 요청 DTO
 *
 * PG사별로 페이로드 형식이 다르지만, 공통적으로 필요한 필드를 추출
 */
data class PgWebhookRequest(
    val pgTransaction: String,  // PG tid (멱등성 키)
    val approvalNo: String? = null,  // 승인 번호 (성공시)
    val amount: BigDecimal,  // 결제 금액
    val status: String,  // PG사 상태 코드 (ex: "paid", "cancelled", "failed")
    val orderNumber: String? = null,  // 주문번호 (내부 거래인 경우)
    val code: String? = null,  // 에러 코드 (실패시)
    val message: String? = null,  // 에러 메시지 (실패시)
    val rawPayload: Map<String, Any>? = null  // 원본 페이로드 (디버깅/감사)
)

/**
 * Webhook 처리 결과 응답 DTO
 */
data class PgWebhookResponse(
    val success: Boolean,
    val message: String? = null,
    val paymentId: Long? = null  // Payment 생성 성공시 ID
)
