package com.hamsterworld.cashgateway.app.payment.service

import com.hamsterworld.cashgateway.app.payment.dto.CashGatewayResponse
import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.app.payment.dto.PaymentRegisterRequest
import com.hamsterworld.cashgateway.domain.payment.constant.PaymentStatus
import com.hamsterworld.cashgateway.domain.payment.model.Payment
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.cashgateway.domain.payment.repository.PaymentRepository
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClient
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.external.paymentgateway.dto.abs.ApprovePaymentCtx
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentGatewayClient: PaymentGatewayClient,
    private val paymentProcessRepository: PaymentProcessRepository,
    private val paymentRepository: PaymentRepository
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
     * TODO: 구현 필요
     * 1. customMid로 PgMerchantMapping 조회 → originSource 확인
     * 2. PaymentAttempt 생성 (SUCCESS/CANCELLED 상태)
     * 3. Payment 생성
     * 4. 반환
     *
     * @param request PaymentRegisterRequest
     * @return Payment
     */
    @Transactional
    fun register(request: PaymentRegisterRequest): Payment {
        // TODO: cashGatewayMid로 PgMerchantMapping 조회하여 provider와 originSource 확인
        // val mapping = pgMerchantMappingRepository.findByCashGatewayMid(request.cashGatewayMid)
        //     ?: throw CustomRuntimeException("Invalid cashGatewayMid: ${request.cashGatewayMid}")
        // val provider = mapping.provider
        // val originSource = mapping.originSource

        // 임시: Provider.DUMMY 사용, originSource를 cashGatewayMid 기반으로 생성
        val provider = com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider.DUMMY
        val originSource = "EXTERNAL_${request.cashGatewayMid}"

        // PaymentProcess 생성
        val process = PaymentProcess(
            orderPublicId = null,  // 외부 거래는 orderPublicId 없음
            userPublicId = null,
            provider = provider,  // TODO: PgMerchantMapping에서 조회한 provider 사용
            mid = request.cashGatewayMid,
            amount = request.amount,
            status = when (request.status) {
                PaymentStatus.APPROVED -> PaymentProcessStatus.SUCCESS
                PaymentStatus.CANCELLED -> PaymentProcessStatus.CANCELLED
                else -> throw CustomRuntimeException("지원하지 않는 status: ${request.status}")
            },
            gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(provider, request.cashGatewayMid),
            orderNumber = null,
            code = request.code,
            message = request.message,
            pgTransaction = request.tid,
            pgApprovalNo = request.approvalNo,
            originSource = originSource,
            requestPayload = null,  // 외부 요청은 payload 없음
            responsePayload = null
        )

        val savedProcess = paymentProcessRepository.save(process)

        log.info("PaymentProcess 외부 등록: processId={}, tid={}, status={}, cashGatewayMid={}",
            savedProcess.id, savedProcess.pgTransaction, savedProcess.status, request.cashGatewayMid)

        // Payment 생성 (APPROVED만)
        if (request.status != PaymentStatus.APPROVED) {
            throw CustomRuntimeException("외부 결제 등록은 APPROVED만 지원: ${request.status}")
        }

        val payment = Payment(
            processId = savedProcess.id!!,
            orderPublicId = null,
            userPublicId = null,
            provider = provider,  // TODO: PgMerchantMapping에서 조회한 provider 사용
            mid = request.cashGatewayMid,
            amount = request.amount,
            pgTransaction = request.tid,
            pgApprovalNo = request.approvalNo ?: request.tid,  // approvalNo 없으면 tid 사용
            gatewayReferenceId = savedProcess.gatewayReferenceId!!,  // PaymentProcess에서 생성됨
            status = PaymentStatus.APPROVED,
            originSource = originSource
        )

        val savedPayment = paymentRepository.save(payment)

        log.info("[외부 Payment 생성] paymentId={}, tid={}, originSource={}, cashGatewayMid={}",
            savedPayment.id, savedPayment.pgTransaction, savedPayment.originSource, request.cashGatewayMid)

        return savedPayment
    }
}
