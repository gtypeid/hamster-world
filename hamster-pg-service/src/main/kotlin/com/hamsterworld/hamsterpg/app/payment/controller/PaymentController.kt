package com.hamsterworld.hamsterpg.app.payment.controller

import com.hamsterworld.hamsterpg.app.payment.request.PaymentSearchRequest
import com.hamsterworld.hamsterpg.app.payment.response.TransactionResponse
import com.hamsterworld.hamsterpg.domain.payment.service.PaymentService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Payment Controller
 *
 * 확정된 거래(Payment) 조회 및 노티 재발송 API.
 * Payment 생성은 PaymentProcessEventHandler를 통해서만 이루어진다.
 */
@RestController
@RequestMapping("/api/payment")
class PaymentController(
    private val paymentService: PaymentService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @GetMapping("/{tid}")
    fun getTransaction(@PathVariable tid: String): ResponseEntity<TransactionResponse> {
        return ResponseEntity.ok(paymentService.getTransactionResponse(tid))
    }

    @GetMapping("/list")
    fun searchTransactionList(
        @ModelAttribute search: PaymentSearchRequest
    ): ResponseEntity<List<TransactionResponse>> {
        return ResponseEntity.ok(paymentService.searchTransactionsResponseList(search))
    }

    @GetMapping("/page")
    fun searchTransactionPage(
        @ModelAttribute search: PaymentSearchRequest
    ): ResponseEntity<Page<TransactionResponse>> {
        return ResponseEntity.ok(paymentService.searchTransactionsResponsePage(search))
    }

    /**
     * 노티 재발송 (tid 기반)
     */
    @PostMapping("/{tid}/resend-notification")
    fun resendNotification(@PathVariable tid: String): ResponseEntity<Unit> {
        log.info("[노티 재발송 API] tid={}", tid)
        paymentService.resendNotification(tid)
        return ResponseEntity.accepted().build()
    }
}
