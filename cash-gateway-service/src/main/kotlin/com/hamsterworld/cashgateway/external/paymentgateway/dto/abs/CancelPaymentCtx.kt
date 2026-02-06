package com.hamsterworld.cashgateway.external.paymentgateway.dto.abs

import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import java.math.BigDecimal

/**
 * Cancel Payment Context
 *
 * ## 변경 사항
 * - 기존: payment: Payment 파라미터 포함
 * - 변경: payment 제거, originTid 추가
 * - 이유: originProcess는 orderPublicId로 조회 가능하지만, PG 취소 요청에는 originTid 필요
 */
class CancelPaymentCtx(
    userPublicId: String,     // E-commerce Service의 User Public ID (Snowflake Base62)
    orderPublicId: String,    // E-commerce Service의 Order Public ID (Snowflake Base62)
    orderNumber: String,
    amount: BigDecimal,
    mid: String,
    val originTid: String     // 원본 PG 거래번호 (취소 대상)
) : PaymentCtx(PaymentStatus.CANCELLED, userPublicId, orderPublicId, orderNumber, amount, mid)
