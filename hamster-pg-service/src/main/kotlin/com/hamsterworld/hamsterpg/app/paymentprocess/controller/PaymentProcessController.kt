package com.hamsterworld.hamsterpg.app.paymentprocess.controller

import com.hamsterworld.hamsterpg.app.paymentprocess.request.ProcessPaymentRequest
import com.hamsterworld.hamsterpg.app.paymentprocess.response.PaymentProcessDetailsResponse
import com.hamsterworld.hamsterpg.app.paymentprocess.response.ProcessPaymentResponse
import com.hamsterworld.hamsterpg.domain.paymentprocess.service.PaymentProcessService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/payment-process")
class PaymentProcessController(
    private val paymentProcessService: PaymentProcessService
) {

    companion object {
        private val log = LoggerFactory.getLogger(PaymentProcessController::class.java)
    }

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
