package com.hamsterworld.hamsterpg.domain.payment.service

import com.hamsterworld.hamsterpg.app.payment.request.PaymentSearchRequest
import com.hamsterworld.hamsterpg.domain.payment.constant.PaymentStatus
import com.hamsterworld.hamsterpg.domain.payment.model.Payment
import com.hamsterworld.hamsterpg.domain.payment.repository.PaymentRepository
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class PaymentService(
    private val repository: PaymentRepository
) {

    @Transactional
    fun createPayment(
        midId: String,
        orderPublicId: String,
        amount: BigDecimal,
        callbackUrl: String,
        echo: String?
    ): Payment {
        val payment = Payment(
            midId = midId,
            orderPublicId = orderPublicId,
            amount = amount,
            callbackUrl = callbackUrl,
            echo = echo,
            status = PaymentStatus.PENDING
        )
        return repository.save(payment)
    }

    @Transactional
    fun resendNotification(id: Long): Payment {
        val payment = repository.findById(id)

        if (payment.status !in listOf(PaymentStatus.COMPLETED, PaymentStatus.FAILED)) {
            throw IllegalStateException("Payment not completed: $id")
        }

        return payment
    }

    @Transactional
    fun requestCancelPayment(tid: String): Payment {
        val payment = repository.findByTid(tid)

        if (payment.status == PaymentStatus.CANCELLED) {
            throw IllegalStateException("Payment already cancelled: $tid")
        }

        if (payment.status == PaymentStatus.CANCEL_PENDING) {
            return payment // Already in cancel pending state
        }

        if (payment.status !in listOf(PaymentStatus.PENDING, PaymentStatus.COMPLETED)) {
            throw IllegalStateException("Payment cannot be cancelled: $tid (status=${payment.status})")
        }

        val cancelRequested = payment.requestCancel()
        return repository.save(cancelRequested)
    }

    fun getTransaction(tid: String): Payment {
        return repository.findByTid(tid)
    }

    fun searchTransactions(request: PaymentSearchRequest): List<Payment> {
        return repository.searchList(request)
    }

    fun searchTransactionsPage(request: PaymentSearchRequest): Page<Payment> {
        return repository.searchPage(request)
    }
}
