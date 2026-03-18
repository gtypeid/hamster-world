package com.hamsterworld.payment.domain.payment.repository

import com.hamsterworld.payment.domain.payment.model.Payment
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface PaymentJpaRepository : JpaRepository<Payment, Long> {

    fun findByPublicId(publicId: String): Optional<Payment>

    fun findByOrderPublicId(orderPublicId: String): List<Payment>

    fun findByProcessPublicId(processPublicId: String): Optional<Payment>

    fun findByPgTransaction(pgTransaction: String): Optional<Payment>

    fun findByGatewayPaymentPublicId(gatewayPaymentPublicId: String): Optional<Payment>
}
