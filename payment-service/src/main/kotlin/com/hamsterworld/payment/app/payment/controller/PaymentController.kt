package com.hamsterworld.payment.app.payment.controller

import com.hamsterworld.payment.app.payment.response.PaymentResponse
import com.hamsterworld.payment.domain.payment.dto.PaymentSearchRequest
import com.hamsterworld.payment.domain.payment.service.PaymentService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/payments")
class PaymentController(
    private val paymentService: PaymentService
) {

    @GetMapping("/list")
    fun getPaymentList(
        request: PaymentSearchRequest
    ): ResponseEntity<List<PaymentResponse>> {
        val responses = paymentService.searchPayments(request)
        return ResponseEntity.ok(responses)
    }

    @GetMapping("/page")
    fun getPaymentPage(
        request: PaymentSearchRequest
    ): ResponseEntity<Page<PaymentResponse>> {
        val responses = paymentService.searchPaymentPage(request)
        return ResponseEntity.ok(responses)
    }

    @GetMapping("/{publicId}")
    fun getPaymentDetail(
        @PathVariable publicId: String
    ): ResponseEntity<PaymentResponse> {
        val response = paymentService.findPaymentByPublicId(publicId)
        return ResponseEntity.ok(response)
    }
}
