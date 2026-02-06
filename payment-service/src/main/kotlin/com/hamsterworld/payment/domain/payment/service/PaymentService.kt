package com.hamsterworld.payment.domain.payment.service

import com.hamsterworld.payment.app.payment.response.PaymentResponse
import com.hamsterworld.payment.domain.payment.dto.PaymentSearchRequest
import com.hamsterworld.payment.domain.payment.repository.PaymentRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Payment 도메인 서비스
 *
 * Internal Admin용 Payment 조회 API
 */
@Service
class PaymentService(
    private val paymentRepository: PaymentRepository
) {

    /**
     * Payment 검색 (List, Response 형태로 반환)
     */
    @Transactional(readOnly = true)
    fun searchPayments(request: PaymentSearchRequest): List<PaymentResponse> {
        return paymentRepository.findAllWithOriginPublicIds(request)
    }

    /**
     * Payment 검색 (Page, Response 형태로 반환)
     */
    @Transactional(readOnly = true)
    fun searchPaymentPage(request: PaymentSearchRequest): Page<PaymentResponse> {
        return paymentRepository.findAllPageWithOriginPublicIds(request)
    }

    /**
     * Payment 상세 조회 (Public ID, Response 형태로 반환)
     */
    @Transactional(readOnly = true)
    fun findPaymentByPublicId(publicId: String): PaymentResponse {
        val payment = paymentRepository.findByPublicId(publicId)

        // originPaymentId가 있으면 조회
        val originPaymentPublicId = payment.originPaymentId?.let { originId ->
            paymentRepository.findByIds(setOf(originId))[originId]
        }

        return PaymentResponse.from(payment, originPaymentPublicId)
    }
}
