package com.hamsterworld.cashgateway.domain.payment.repository

import com.hamsterworld.cashgateway.domain.payment.model.Payment
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository

@Repository
class PaymentRepository(
    private val paymentJpaRepository: PaymentJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(payment: Payment): Payment {
        return paymentJpaRepository.save(payment)
    }

    fun findById(id: Long): Payment {
        return paymentJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("결제 찾지 못함 ID: $id") }
    }

    fun findByOrderPublicId(orderPublicId: String): Payment {
        return paymentJpaRepository.findByOrderPublicId(orderPublicId)
            .orElseThrow { CustomRuntimeException("결제 찾지 못함 orderPublicId: $orderPublicId") }
    }
}
