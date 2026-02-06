package com.hamsterworld.cashgateway.domain.paymentprocess.repository

import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface PaymentProcessJpaRepository : JpaRepository<PaymentProcess, Long> {

    fun findTopByOrderPublicIdAndUserPublicIdAndProviderAndStatus(
        orderPublicId: String,  // E-commerce Service의 Order Public ID (Snowflake Base62)
        userPublicId: String,   // E-commerce Service의 User Public ID (Snowflake Base62)
        provider: Provider,
        status: PaymentProcessStatus
    ): Optional<PaymentProcess>

    fun findByPgTransaction(tid: String): PaymentProcess?

    fun findByProviderAndMid(
        provider: Provider?,
        mid: String
    ): Optional<PaymentProcess>
}
