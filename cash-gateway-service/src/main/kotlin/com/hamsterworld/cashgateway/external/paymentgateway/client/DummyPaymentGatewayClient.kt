package com.hamsterworld.cashgateway.external.paymentgateway.client

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientProtocolCore
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayCoreService
import com.hamsterworld.cashgateway.external.paymentgateway.provider.DummyPaymentGatewayProvider
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

@Component
class DummyPaymentGatewayClient(
    pgRestTemplate: RestTemplate,
    objectMapper: ObjectMapper,
    domainConverterAdapter: DomainConverterAdapter,
    paymentGatewayCoreService: PaymentGatewayCoreService,
    provider: DummyPaymentGatewayProvider
) : PaymentGatewayClientProtocolCore(
    pgRestTemplate,
    objectMapper,
    domainConverterAdapter,
    paymentGatewayCoreService,
    provider
) {
    private val log = LoggerFactory.getLogger(DummyPaymentGatewayClient::class.java)
}
