package com.hamsterworld.hamsterpg.app.paymentprocess.controller

import com.hamsterworld.hamsterpg.app.paymentprocess.request.ProcessPaymentRequest
import com.hamsterworld.hamsterpg.app.paymentprocess.response.PaymentProcessDetailsResponse
import com.hamsterworld.hamsterpg.app.paymentprocess.response.ProcessPaymentResponse
import com.hamsterworld.hamsterpg.domain.paymentprocess.service.PaymentProcessService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * PaymentProcess Controller
 *
 * Cash Gateway의 DummyPaymentGatewayProvider와 통신하는 엔드포인트
 * - POST /api/payment-process: 결제 요청 접수 (202 Accepted)
 * - GET /api/payment-process/transaction/{tid}: 트랜잭션 조회 (디버깅용)
 */
@RestController
@RequestMapping("/api/payment-process")
class PaymentProcessController(
    private val paymentProcessService: PaymentProcessService
) {

    companion object {
        private val logger = LoggerFactory.getLogger(PaymentProcessController::class.java)
    }

    /**
     * 결제 요청 접수
     *
     * Cash Gateway → Hamster PG
     * - 요청을 접수하고 PENDING 상태로 저장
     * - 202 Accepted 응답 (비동기 처리)
     * - 폴링 스케줄러가 3-5초 후 자동 처리
     */
    @PostMapping
    fun acceptPayment(
        @RequestBody request: ProcessPaymentRequest
    ): ResponseEntity<ProcessPaymentResponse> {
        logger.info(
            "Payment request received - orderId: {}, amount: {}",
            request.orderId, request.amount
        )

        val response = paymentProcessService.acceptPaymentRequest(request)

        return ResponseEntity
            .status(HttpStatus.ACCEPTED)  // 202 Accepted
            .body(response)
    }

    /**
     * 트랜잭션 조회 (디버깅용)
     */
    @GetMapping("/transaction/{tid}")
    fun getTransaction(@PathVariable tid: String): ResponseEntity<PaymentProcessDetailsResponse> {
        val response = paymentProcessService.findByTidResponse(tid)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(response)
    }

    /**
     * 수동 Webhook 트리거 (테스트용)
     *
     * POST /api/payment/webhook/trigger/{tid}?status=SUCCESS
     * POST /api/payment/webhook/trigger/{tid}?status=FAILED
     */
    @PostMapping("/webhook/trigger/{tid}")
    fun triggerWebhook(
        @PathVariable tid: String,
        @RequestParam(defaultValue = "SUCCESS") status: String
    ): ResponseEntity<String> {
        val process = paymentProcessService.findByTid(tid)
            ?: return ResponseEntity.notFound().build()

        logger.info("Manual webhook trigger - tid: {}, status: {}", tid, status)

        // TODO: 수동 트리거 로직 (필요 시 Service로 분리)
        return ResponseEntity.ok("Manual webhook trigger requested for tid: $tid with status: $status")
    }
}
