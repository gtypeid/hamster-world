package com.hamsterworld.cashgateway.external.paymentgateway.abs

import com.hamsterworld.cashgateway.external.paymentgateway.constant.Provider
import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Component

@Component
class PaymentGatewayClientRegistry(
    clients: List<PaymentGatewayClientProtocol>
) {
    private val clientMap: Map<Class<out PaymentGatewayClientProtocol>, PaymentGatewayClientProtocol> =
        clients.associateBy { it::class.java }

    @Suppress("UNCHECKED_CAST")
    fun <T : PaymentGatewayClientProtocol> getClient(clientClass: Class<T>): T {
        val client = clientMap[clientClass] as? T
            ?: throw CustomRuntimeException("Pg 프로바이더 찾지 못함 ${clientClass.name}")
        return client
    }

    /**
     * Provider로 Client 조회
     *
     * Registry에 등록된 모든 Client를 순회하면서 해당 Provider를 가진 Client 반환
     */
    fun getClientByProvider(provider: Provider): PaymentGatewayClientProtocol {
        return clientMap.values.find { client ->
            client.getProvider() == provider
        } ?: throw CustomRuntimeException("Provider에 해당하는 Client 없음: ${provider.name}")
    }
}
