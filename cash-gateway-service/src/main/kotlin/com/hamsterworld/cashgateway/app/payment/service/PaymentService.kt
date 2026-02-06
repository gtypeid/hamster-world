package com.hamsterworld.cashgateway.app.payment.service

import com.hamsterworld.cashgateway.app.payment.dto.CashGatewayResponse
import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClient
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentGatewayClient: PaymentGatewayClient
) {
    private val log = LoggerFactory.getLogger(PaymentService::class.java)

    /**
     * 내부 결제 승인 요청 (ecommerce → cash-gateway → PG)
     *
     * 1. PaymentGatewayClient를 통해 PG 요청
     * 2. PaymentAttempt 생성 (UNKNOWN 상태)
     * 3. Webhook으로 최종 결과 수신 예정
     *
     * **트랜잭션 전파 정책**:
     * - `MANDATORY`: 반드시 부모 트랜잭션 내에서 호출되어야 함
     * - 호출 경로: PaymentEventConsumer(MANDATORY) → approve(MANDATORY) → payment(MANDATORY) → handleRequest(MANDATORY)
     * - 목적: Kafka Consumer 트랜잭션과 원자성 보장 (전체 성공 or 전체 롤백)
     *
     * @param request PaymentApproveRequest
     * @return CashGatewayResponse (Webhook 대기 메시지)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    fun approve(request: PaymentApproveRequest): CashGatewayResponse {
        // TODO: cashGatewayMid로 PgMerchantMapping 조회하여 검증
        // - Provider와 MID 매칭 확인
        // - originSource 확인

        val ctx = ApprovePaymentCtx(
            userPublicId = request.userPublicId,
            orderPublicId = request.orderPublicId,
            orderNumber = request.orderNumber,
            amount = request.amount,
            mid = request.cashGatewayMid
        )

        // PG 요청 (무조건 null 반환 - Webhook 대기)
        paymentGatewayClient.bind(request.provider).payment(ctx)

        log.info("[PG 요청 완료] orderPublicId={}, provider={}, cashGatewayMid={}",
            request.orderPublicId, request.provider, request.cashGatewayMid)

        return CashGatewayResponse(
            success = true,
            message = "PG 요청 완료 - Webhook으로 최종 결과 수신 예정",
            orderPublicId = request.orderPublicId
        )
    }

    /**
     * 외부 결제 등록 (외부 서비스 → cash-gateway)
     *
     * TODO: 향후 구현 필요 시 Payment Service로 이벤트 발행하여 처리
     * - Payment entity는 Payment Service에서만 관리
     * - Cash Gateway는 PaymentProcess만 생성하고 이벤트 발행
     */
}
