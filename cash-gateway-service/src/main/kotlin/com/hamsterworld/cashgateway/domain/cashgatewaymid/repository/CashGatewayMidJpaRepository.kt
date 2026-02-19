package com.hamsterworld.cashgateway.domain.cashgatewaymid.repository

import com.hamsterworld.cashgateway.domain.cashgatewaymid.model.CashGatewayMid
import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import org.springframework.data.jpa.repository.JpaRepository

interface CashGatewayMidJpaRepository : JpaRepository<CashGatewayMid, Long> {
    fun findByProviderAndMid(provider: Provider, mid: String): CashGatewayMid?
    fun findByProviderAndMidAndIsActiveTrue(provider: Provider, mid: String): CashGatewayMid?
    fun findByMidAndIsActiveTrue(mid: String): CashGatewayMid?
    fun findByProviderAndUserKeycloakIdAndIsActiveTrue(provider: Provider, userKeycloakId: String): CashGatewayMid?
    fun findByProviderAndPgMidAndIsActiveTrue(provider: Provider, pgMid: String): List<CashGatewayMid>
    fun findByProviderAndPgMidAndUserKeycloakIdAndIsActiveTrue(provider: Provider, pgMid: String, userKeycloakId: String): CashGatewayMid?
}
