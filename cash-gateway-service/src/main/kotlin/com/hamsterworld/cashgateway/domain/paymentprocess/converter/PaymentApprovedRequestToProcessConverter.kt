package com.hamsterworld.cashgateway.domain.paymentprocess.converter

import com.fasterxml.jackson.databind.ObjectMapper
import com.hamsterworld.cashgateway.domain.paymentprocess.constant.PaymentProcessStatus
import com.hamsterworld.cashgateway.external.paymentgateway.dto.PaymentApprovedRequestWithCtx
import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess
import com.hamsterworld.common.domain.converter.DomainConverter
import com.hamsterworld.common.tracing.TraceContextHolder
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * 결제 승인 요청 → PaymentProcess 변환 컨버터
 *
 * PG 결제 요청 시 [PaymentApprovedRequestWithCtx]를 [PaymentProcess] 엔티티로 변환합니다.
 * [DomainConverterAdapter]가 `isSupport()` 매칭을 통해 이 컨버터를 자동 선택합니다.
 *
 * ## 변경 이력
 * - **2026-02-09** (Claude Opus 4 / claude-opus-4-6):
 *   Grafana Tempo 분산 추적 통합을 위해 trace context 캡처 로직 추가.
 *   - `TraceContextHolder.getCurrentTraceId()/getCurrentSpanId()` 호출하여
 *     현재 Kafka consumer observation의 traceId/spanId를 PaymentProcess에 저장
 *   - 저장된 traceId/spanId는 이후 Webhook 콜백 시
 *     `PaymentGatewayClientProtocolCore.handleInternalWebhook()`에서
 *     `TraceContextHolder.executeWithRestoredTrace("webhook-callback")`의 parent로 사용됨
 *   - 이를 통해 "주문 생성 → Kafka → PG 요청 → Webhook 콜백 → 이벤트 발행" 전체 flow가
 *     단일 traceId로 연결됨
 *
 *   **디버깅 이력 (동일 세션)**:
 *   기존에 동일한 `isSupport()` 조건을 가진 `PaymentRequestToProcessConverter`가 별도로 존재했으나,
 *   `DomainConverterAdapter.find()`가 이 클래스(`PaymentApprovedRequestToProcessConverter`)를
 *   먼저 매칭하여, trace 캡처가 추가된 `PaymentRequestToProcessConverter`는 호출되지 않았음.
 *   → 중복 컨버터(`PaymentRequestToProcessConverter`) 삭제 후 이 클래스에 직접 trace 캡처 추가.
 *
 * ## 아키텍처 컨텍스트
 * ```
 * [Kafka Consumer: OrderStockReservedEvent]
 *   └── PaymentEventConsumer.handleOrderStockReserved()
 *       └── PaymentService.approve()
 *           └── PaymentGatewayClientProtocolCore.payment()
 *               └── DomainConverterAdapter.convert(PaymentApprovedRequestWithCtx, PaymentProcess)
 *                   └── 이 클래스의 convert()
 *                       ├── TraceContextHolder.getCurrentTraceId() → MDC에서 traceId 캡처
 *                       └── PaymentProcess(traceId=..., spanId=...) 생성
 *                           └── DB 저장 → Webhook에서 trace 복원 시 사용
 * ```
 *
 * @see com.hamsterworld.common.tracing.TraceContextHolder.getCurrentTraceId MDC fallback 포함 trace ID 획득
 * @see com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientProtocolCore.handleInternalWebhook 저장된 traceId로 trace 복원
 */
@Component
class PaymentApprovedRequestToProcessConverter(
    private val objectMapper: ObjectMapper
) : DomainConverter<PaymentApprovedRequestWithCtx, PaymentProcess> {

    private val log = LoggerFactory.getLogger(PaymentApprovedRequestToProcessConverter::class.java)

    override fun isSupport(sourceType: Class<*>, targetType: Class<*>): Boolean {
        return sourceType == PaymentApprovedRequestWithCtx::class.java && targetType == PaymentProcess::class.java
    }

    override fun convert(source: PaymentApprovedRequestWithCtx): PaymentProcess {
        try {
            val provider = source.provider
            val ctx = source.paymentCtx
            val paymentRequest = source.paymentRequest

            // [2026-02-09] Claude Opus 4: Webhook 콜백 시 원본 trace에 연결하기 위해
            // 현재 Kafka consumer observation의 trace context를 캡처.
            // getCurrentTraceId()는 micrometer Tracer → OTel API → SLF4J MDC 순으로 시도함.
            // Kafka consumer observation 환경에서는 MDC fallback이 실제로 사용됨
            // (micrometer currentSpan()과 OTel Span.current() 모두 null 반환하는 환경).
            val capturedTraceId = TraceContextHolder.getCurrentTraceId()
            val capturedSpanId = TraceContextHolder.getCurrentSpanId()
            log.info("[TraceCapture] traceId={}, spanId={}, thread={}", capturedTraceId, capturedSpanId, Thread.currentThread().name)

            val providerEnum = provider.getProvider()
            return PaymentProcess(
                orderPublicId = ctx.orderPublicId,
                userPublicId = ctx.userPublicId,
                orderNumber = ctx.orderNumber,
                provider = providerEnum,
                mid = ctx.mid,
                amount = ctx.amount,
                status = PaymentProcessStatus.UNKNOWN,
                gatewayReferenceId = PaymentProcess.generateGatewayReferenceId(providerEnum, ctx.mid),
                activeRequestKey = "${ctx.userPublicId}-${ctx.orderPublicId}-${providerEnum}",
                requestPayload = objectMapper.writeValueAsString(paymentRequest),
                // [2026-02-09] Claude Opus 4: DB에 저장되어 Webhook에서 trace 복원 시 parent로 사용됨
                traceId = capturedTraceId,
                spanId = capturedSpanId
            )
        } catch (e: Exception) {
            throw RuntimeException("결제 요청 -> PaymentProcess 변환 실패", e)
        }
    }
}
