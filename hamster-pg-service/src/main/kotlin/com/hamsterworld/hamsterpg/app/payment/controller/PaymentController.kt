package com.hamsterworld.hamsterpg.app.payment.controller

import com.hamsterworld.hamsterpg.app.payment.request.CancelPaymentRequest
import com.hamsterworld.hamsterpg.app.payment.request.CreatePaymentRequest
import com.hamsterworld.hamsterpg.app.payment.request.PaymentRequest
import com.hamsterworld.hamsterpg.app.payment.request.PaymentSearchRequest
import com.hamsterworld.hamsterpg.app.payment.response.PaymentResponse
import com.hamsterworld.hamsterpg.app.payment.response.TransactionResponse
import com.hamsterworld.hamsterpg.domain.pgmid.model.PgMid
import com.hamsterworld.hamsterpg.domain.payment.service.PaymentService
import com.hamsterworld.hamsterpg.web.resolver.CurrentMid
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/payment")
class PaymentController(
    private val transactionService: PaymentService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostMapping
    fun processPayment(
        @Valid @RequestBody request: PaymentRequest,
        @CurrentMid pgMid: PgMid
    ): ResponseEntity<PaymentResponse> {
        log.info("Payment request received: type=${request::class.simpleName}, midId=${pgMid.midId}")

        val response = when (request) {
            is CreatePaymentRequest -> {
                log.info("Creating payment: orderPublicId=${request.orderPublicId}, amount=${request.amount}")
                transactionService.createPaymentResponse(
                    midId = pgMid.midId,
                    orderPublicId = request.orderPublicId,
                    amount = request.amount,
                    callbackUrl = request.callbackUrl,
                    echo = request.echo
                )
            }
            is CancelPaymentRequest -> {
                log.info("Requesting cancellation: tid=${request.tid}")
                transactionService.requestCancelPaymentResponse(request.tid)
            }
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response)
    }

    @GetMapping("/list")
    fun searchTransactionList(
        @ModelAttribute search: PaymentSearchRequest
    ): ResponseEntity<List<TransactionResponse>> {
        log.info("Searching transactions (list): midId=${search.midId}, status=${search.status}, orderPublicId=${search.orderPublicId}")

        val responses = transactionService.searchTransactionsResponseList(search)

        log.info("Found ${responses.size} transactions")

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/page")
    fun searchTransactionPage(
        @ModelAttribute search: PaymentSearchRequest
    ): ResponseEntity<Page<TransactionResponse>> {
        log.info("Searching transactions (page): page=${search.page}, size=${search.size}, midId=${search.midId}")

        val responses = transactionService.searchTransactionsResponsePage(search)

        log.info("Found ${responses.totalElements} transactions (page ${responses.number}/${responses.totalPages})")

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/{tid}")
    fun getTransaction(
        @PathVariable tid: String
    ): ResponseEntity<TransactionResponse> {
        log.info("Getting transaction: tid=$tid")

        return ResponseEntity.ok(transactionService.getTransactionResponse(tid))
    }
}
