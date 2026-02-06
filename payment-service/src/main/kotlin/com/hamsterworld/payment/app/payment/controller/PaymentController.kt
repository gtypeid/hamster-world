package com.hamsterworld.payment.app.payment.controller

import com.hamsterworld.payment.app.payment.response.PaymentResponse
import com.hamsterworld.payment.domain.payment.dto.PaymentSearchRequest
import com.hamsterworld.payment.domain.payment.service.PaymentService
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Payment API Controller
 *
 * Internal Admin용 Payment 조회 API
 */
@RestController
@RequestMapping("/api/payments")
class PaymentController(
    private val paymentService: PaymentService
) {

    /**
     * Payment 목록 조회 (List)
     *
     * GET /api/payments/list?orderPublicId=...&from=...&to=...&sort=...
     */
    @GetMapping("/list")
    fun getPaymentList(
        request: PaymentSearchRequest
    ): ResponseEntity<List<PaymentResponse>> {
        val responses = paymentService.searchPayments(request)
        return ResponseEntity.ok(responses)
    }

    /**
     * Payment 목록 조회 (Page)
     *
     * GET /api/payments/page?page=0&size=20&orderPublicId=...&sort=...
     */
    @GetMapping("/page")
    fun getPaymentPage(
        request: PaymentSearchRequest
    ): ResponseEntity<Page<PaymentResponse>> {
        val responses = paymentService.searchPaymentPage(request)
        return ResponseEntity.ok(responses)
    }

    /**
     * Payment 상세 조회
     *
     * GET /api/payments/{publicId}
     *
     * @param publicId Payment Public ID (Snowflake Base62)
     * @return Payment 정보
     */
    @GetMapping("/{publicId}")
    fun getPaymentDetail(
        @PathVariable publicId: String
    ): ResponseEntity<PaymentResponse> {
        val response = paymentService.findPaymentByPublicId(publicId)
        return ResponseEntity.ok(response)
    }
}
