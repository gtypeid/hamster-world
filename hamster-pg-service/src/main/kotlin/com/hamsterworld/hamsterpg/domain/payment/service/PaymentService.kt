package com.hamsterworld.hamsterpg.domain.payment.service

import com.hamsterworld.hamsterpg.app.payment.request.PaymentSearchRequest
import com.hamsterworld.hamsterpg.app.payment.response.TransactionResponse
import com.hamsterworld.hamsterpg.domain.notification.service.NotificationService
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PaymentService(
    private val paymentRepository: PaymentRepository,
    private val notificationService: NotificationService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun resendNotification(tid: String) {
        val payment = paymentRepository.findByTid(tid)
        log.info("[노티 재발송 요청] tid={}, status={}", tid, payment.status)
        notificationService.resendNotification(payment)
    }

    fun getTransactionResponse(tid: String): TransactionResponse {
        return TransactionResponse.from(paymentRepository.findByTid(tid))
    }

    fun searchTransactionsResponseList(request: PaymentSearchRequest): List<TransactionResponse> {
        return paymentRepository.searchList(request).map { TransactionResponse.from(it) }
    }

    fun searchTransactionsResponsePage(request: PaymentSearchRequest): Page<TransactionResponse> {
        return paymentRepository.searchPage(request).map { TransactionResponse.from(it) }
    }
}
