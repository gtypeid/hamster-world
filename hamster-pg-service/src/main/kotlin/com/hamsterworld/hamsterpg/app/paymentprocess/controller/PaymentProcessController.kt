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
 * Cash Gateway로부터 거래 요청을 접수한다.
 * - POST /api/payment-process: 거래 요청 접수 (202 Accepted, ACK)
 * - GET /api/payment-process/transaction/{tid}: 프로세스 조회 (디버깅용)
 */
@RestController
@RequestMapping("/api/payment-process")
class PaymentProcessController(
    private val paymentProcessService: PaymentProcessService
) {

    companion object {
        private val log = LoggerFactory.getLogger(PaymentProcessController::class.java)
    }

    /**
     * 거래 요청 접수
     *
     * ACK 응답만 반환 (tid 미포함).
     * 실제 결과는 스케줄러 처리 후 Notification(웹훅)으로 전달된다.
     */
    @PostMapping
    fun acceptPayment(
        @RequestBody request: ProcessPaymentRequest
    ): ResponseEntity<ProcessPaymentResponse> {
        log.info("[거래 접수] midId={}, orderId={}, amount={}", request.midId, request.orderId, request.amount)

        val response = paymentProcessService.acceptPaymentRequest(request)

        return ResponseEntity
            .status(HttpStatus.ACCEPTED)
            .body(response)
    }

    @GetMapping("/transaction/{tid}")
    fun getTransaction(@PathVariable tid: String): ResponseEntity<PaymentProcessDetailsResponse> {
        val response = paymentProcessService.findByTidResponse(tid)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(response)
    }
}
