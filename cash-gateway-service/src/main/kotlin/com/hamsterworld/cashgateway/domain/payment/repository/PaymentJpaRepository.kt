package com.hamsterworld.cashgateway.domain.payment.repository

import com.hamsterworld.cashgateway.domain.payment.model.Payment
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface PaymentJpaRepository : JpaRepository<Payment, Long> {
    fun findByOrderPublicId(orderPublicId: String): Optional<Payment>
}
