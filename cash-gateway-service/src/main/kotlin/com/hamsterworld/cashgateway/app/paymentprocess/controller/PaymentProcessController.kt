package com.hamsterworld.cashgateway.app.paymentprocess.controller

import com.hamsterworld.cashgateway.app.paymentprocess.response.PaymentProcessResponse
import com.hamsterworld.cashgateway.domain.paymentprocess.dto.PaymentProcessSearchRequest
import com.hamsterworld.cashgateway.domain.paymentprocess.service.PaymentProcessService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/payment-processes")
class PaymentProcessController(
    private val paymentProcessService: PaymentProcessService
) {
    private val log = LoggerFactory.getLogger(PaymentProcessController::class.java)

    @GetMapping("/list")
    fun getPaymentProcessList(
        request: PaymentProcessSearchRequest
    ): ResponseEntity<List<PaymentProcessResponse>> {
        log.debug("[PaymentProcess 목록 조회] orderPublicId={}, provider={}, status={}",
            request.orderPublicId, request.provider, request.statuses)

        val responses = paymentProcessService.searchPaymentProcesses(request)

        log.debug("[PaymentProcess 목록 조회 완료] count={}", responses.size)

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/page")
    fun getPaymentProcessPage(
        request: PaymentProcessSearchRequest
    ): ResponseEntity<Page<PaymentProcessResponse>> {
        log.debug("[PaymentProcess 페이징 조회] orderPublicId={}, provider={}, status={}, page={}, size={}",
            request.orderPublicId, request.provider, request.statuses, request.page, request.size)

        val responses = paymentProcessService.searchPaymentProcessPage(request)

        log.debug("[PaymentProcess 페이징 조회 완료] totalElements={}, totalPages={}",
            responses.totalElements, responses.totalPages)

        return ResponseEntity.ok(responses)
    }
}
