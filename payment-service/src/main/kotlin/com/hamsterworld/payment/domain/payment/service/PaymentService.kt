package com.hamsterworld.payment.domain.payment.service

import com.hamsterworld.payment.app.payment.response.PaymentResponse
import com.hamsterworld.payment.domain.payment.dto.PaymentSearchRequest
import com.hamsterworld.payment.domain.payment.repository.PaymentRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository
) {

    @Transactional(readOnly = true)
    fun searchPayments(request: PaymentSearchRequest): List<PaymentResponse> {
        return paymentRepository.findAllWithOriginPublicIds(request)
    }

    @Transactional(readOnly = true)
    fun searchPaymentPage(request: PaymentSearchRequest): Page<PaymentResponse> {
        return paymentRepository.findAllPageWithOriginPublicIds(request)
    }

    @Transactional(readOnly = true)
    fun findPaymentByPublicId(publicId: String): PaymentResponse {
        val payment = paymentRepository.findByPublicId(publicId)

        val originPaymentPublicId = payment.originPaymentId?.let { originId ->
            paymentRepository.findByIds(setOf(originId))[originId]
        }

        return PaymentResponse.from(payment, originPaymentPublicId)
    }
}
