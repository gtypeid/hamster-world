package com.hamsterworld.cashgateway.external.paymentgateway.client

import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientProtocolCore
import com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayCoreService
import com.hamsterworld.cashgateway.external.paymentgateway.provider.DummyPaymentGatewayProvider
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
 *
 * ## 변경 이력
 * - **2026-02-09** (Claude Opus 4 / claude-opus-4-6):
 *   `traceContextHolder` 생성자 파라미터 추가 (부모 클래스 `PaymentGatewayClientProtocolCore` 변경에 따른 전파).
 *   Spring DI가 `TraceContextHolder` @Component 빈을 자동 주입하여 super에 전달.
 */
@Component
class DummyPaymentGatewayClient(
    pgRestTemplate: RestTemplate,
    objectMapper: ObjectMapper,
    domainConverterAdapter: DomainConverterAdapter,
    paymentGatewayCoreService: PaymentGatewayCoreService,
    provider: DummyPaymentGatewayProvider,
    traceContextHolder: TraceContextHolder  // [2026-02-09] Claude Opus 4 추가
) : PaymentGatewayClientProtocolCore(
    pgRestTemplate,
    objectMapper,
    domainConverterAdapter,
    paymentGatewayCoreService,
    provider,
    traceContextHolder
) {
    private val log = LoggerFactory.getLogger(DummyPaymentGatewayClient::class.java)
}
