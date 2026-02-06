package com.hamsterworld.cashgateway.app.payment.controller

import com.hamsterworld.cashgateway.app.payment.dto.CashGatewayResponse
import com.hamsterworld.cashgateway.app.payment.dto.PaymentApproveRequest
import com.hamsterworld.cashgateway.app.payment.dto.PaymentRegisterRequest
import com.hamsterworld.cashgateway.app.payment.dto.PaymentResponse
import com.hamsterworld.cashgateway.app.payment.service.PaymentService
import com.hamsterworld.cashgateway.domain.payment.repository.PaymentRepository
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * 결제 요청/등록 컨트롤러
 *
 * **엔드포인트**:
 * 1. POST /api/payment/approve - 내부 결제 승인 요청 (ecommerce → cash-gateway → PG)
 * 2. POST /api/payment/register - 외부 결제 등록 (외부 서비스 → cash-gateway)
 *
 * **Case 1: approve()**
 * - ecommerce-service에서 결제 요청
 * - Cash Gateway가 PG에 요청 보냄
 * - 응답: CashGatewayResponse (Webhook 대기)
 *
 * **Case 2: register()**
 * - 외부 서비스가 자체 PG 사용 후 결과 등록
 * - Cash Gateway가 PaymentAttempt + Payment 즉시 생성
 * - 응답: Payment
 */
@RestController
@RequestMapping("/api/payment")
class PaymentController(
    private val paymentService: PaymentService,
    private val paymentProcessRepository: PaymentProcessRepository,
    private val paymentRepository: PaymentRepository
) {
    private val log = LoggerFactory.getLogger(PaymentController::class.java)

    /**
     * 내부 결제 승인 요청
     *
     * @param request PaymentApproveRequest (orderPublicId, userPublicId, amount, provider, orderNumber)
     * @return CashGatewayResponse (success, message, orderPublicId)
     */
    @PostMapping("/approve")
    fun approve(@RequestBody request: PaymentApproveRequest): ResponseEntity<CashGatewayResponse> {
        log.info("[결제 승인 요청] orderPublicId={}, provider={}, amount={}",
            request.orderPublicId, request.provider, request.amount)

        val response = paymentService.approve(request)

        log.info("[결제 승인 요청 완료] orderPublicId={}, message={}",
            request.orderPublicId, response.message)

        return ResponseEntity.ok(response)
    }

    /**
     * 외부 결제 등록
     *
     * @param request PaymentRegisterRequest (customMid, tid, amount, approvalNo, status)
     * @return PaymentResponse
     */

    /*
    @PostMapping("/register")
    fun register(@RequestBody request: PaymentRegisterRequest): ResponseEntity<PaymentResponse> {
        log.info("[외부 결제 등록] cashGatewayMid={}, tid={}, amount={}, status={}",
            request.cashGatewayMid, request.tid, request.amount, request.status)

        val payment = paymentService.register(request)

        // PaymentAttempt Public ID 조회
        val process = paymentProcessRepository.findById(payment.processId)

        // Origin Payment Public ID 조회 (취소건인 경우)
        val originPaymentPublicId = payment.originPaymentId?.let { originId ->
            paymentRepository.findById(originId).publicId
        }

        val response = PaymentResponse.from(payment,process.publicId, originPaymentPublicId)

        log.info("[외부 결제 등록 완료] paymentPublicId={}, tid={}",
            payment.publicId, payment.pgTransaction)

        return ResponseEntity.ok(response)
    }

    */
}
