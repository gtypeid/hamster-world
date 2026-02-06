package com.hamsterworld.cashgateway.app.payment.dto

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

/**
 * 외부 결제 등록 요청 DTO (외부 서비스 → cash-gateway)
 *
 * Case 2: 외부 서비스가 자체 PG 사용 후 결과 등록
 * - 외부 서비스가 자체 PG로 결제 처리
 * - Cash Gateway는 결제 결과만 받아서 정산 시스템에 등록
 * - cashGatewayMid로 originSource 조회
 */
data class PaymentRegisterRequest(
    val cashGatewayMid: String,       // Cash Gateway 발급 MID (originSource 조회용)
    val tid: String,                  // 외부 PG tid
    val amount: BigDecimal,           // 결제 금액
    val approvalNo: String?,          // 승인 번호 (승인 시)
    val status: PaymentStatus,        // APPROVED or CANCELLED
    val code: String? = null,         // 응답 코드
    val message: String? = null       // 응답 메시지
)
