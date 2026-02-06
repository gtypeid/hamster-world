package com.hamsterworld.cashgateway.domain.paymentprocess.service

import com.hamsterworld.cashgateway.app.paymentprocess.response.PaymentProcessResponse
import com.hamsterworld.cashgateway.domain.paymentprocess.dto.PaymentProcessSearchRequest
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * PaymentProcess 도메인 서비스
 *
 * Internal Admin용 PaymentProcess 조회 API
 */
@Service
class PaymentProcessService(
    private val paymentProcessRepository: PaymentProcessRepository
) {

    /**
     * PaymentProcess 검색 (List, Response 형태로 반환)
     */
    @Transactional(readOnly = true)
    fun searchPaymentProcesses(request: PaymentProcessSearchRequest): List<PaymentProcessResponse> {
        return paymentProcessRepository.findAllWithOriginPublicIds(request)
    }

    /**
     * PaymentProcess 검색 (Page, Response 형태로 반환)
     */
    @Transactional(readOnly = true)
    fun searchPaymentProcessPage(request: PaymentProcessSearchRequest): Page<PaymentProcessResponse> {
        return paymentProcessRepository.findAllPageWithOriginPublicIds(request)
    }

}
