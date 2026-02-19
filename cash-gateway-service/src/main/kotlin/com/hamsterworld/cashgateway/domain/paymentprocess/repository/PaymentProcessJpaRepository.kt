package com.hamsterworld.cashgateway.domain.paymentprocess.repository

import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface PaymentProcessJpaRepository : JpaRepository<PaymentProcess, Long> {

    fun findTopByOrderPublicIdAndUserKeycloakIdAndProviderAndStatus(
        orderPublicId: String,  // E-commerce Service의 Order Public ID (Snowflake Base62)
        userKeycloakId: String, // User의 Keycloak Subject ID (외부 시스템 UUID)
        provider: Provider,
        status: PaymentProcessStatus
    ): Optional<PaymentProcess>

    fun findByPgTransaction(tid: String): PaymentProcess?

    fun findByProviderAndCashGatewayMid(
        provider: Provider?,
        cashGatewayMid: String
    ): Optional<PaymentProcess>
}
