package com.hamsterworld.cashgateway.external.paymentgateway.client

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientProtocolCore
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayCoreService
import com.hamsterworld.cashgateway.external.paymentgateway.provider.DummyPaymentGatewayProvider
import com.hamsterworld.cashgateway.domain.cashgatewaymid.repository.CashGatewayMidRepository
import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.common.domain.converter.DomainConverterAdapter
import com.hamsterworld.common.tracing.TraceContextHolder
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

/**
 * Dummy PG 결제 게이트웨이 클라이언트
 *
 * 개발/테스트용 더미 PG 클라이언트. 실제 PG 연동 없이 결제 플로우를 테스트할 수 있음.
 */
@Component
class DummyPaymentGatewayClient(
    pgRestTemplate: RestTemplate,
    objectMapper: ObjectMapper,
    domainConverterAdapter: DomainConverterAdapter,
    paymentGatewayCoreService: PaymentGatewayCoreService,
    provider: DummyPaymentGatewayProvider,
    traceContextHolder: TraceContextHolder,
    cashGatewayMidRepository: CashGatewayMidRepository
) : PaymentGatewayClientProtocolCore(
    pgRestTemplate,
    objectMapper,
    domainConverterAdapter,
    paymentGatewayCoreService,
    provider,
    traceContextHolder,
    cashGatewayMidRepository
) {
    private val log = LoggerFactory.getLogger(DummyPaymentGatewayClient::class.java)
}
