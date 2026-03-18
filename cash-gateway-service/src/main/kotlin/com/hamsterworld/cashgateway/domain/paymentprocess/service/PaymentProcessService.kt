package com.hamsterworld.cashgateway.domain.paymentprocess.service

import com.hamsterworld.cashgateway.app.paymentprocess.response.PaymentProcessResponse
import com.hamsterworld.cashgateway.domain.paymentprocess.dto.PaymentProcessSearchRequest
import com.hamsterworld.cashgateway.domain.paymentprocess.repository.PaymentProcessRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentProcessService(
    private val paymentProcessRepository: PaymentProcessRepository
) {

    @Transactional(readOnly = true)
    fun searchPaymentProcesses(request: PaymentProcessSearchRequest): List<PaymentProcessResponse> {
        return paymentProcessRepository.findAllWithOriginPublicIds(request)
    }

    @Transactional(readOnly = true)
    fun searchPaymentProcessPage(request: PaymentProcessSearchRequest): Page<PaymentProcessResponse> {
        return paymentProcessRepository.findAllPageWithOriginPublicIds(request)
    }

}
