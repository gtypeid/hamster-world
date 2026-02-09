package com.hamsterworld.common.tracing

import io.micrometer.tracing.Tracer as MicrometerTracer
import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanContext
import io.opentelemetry.api.trace.TraceFlags
import io.opentelemetry.api.trace.TraceState
import io.opentelemetry.context.Context
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.stereotype.Component

/**
 * OpenTelemetry Trace Context 헬퍼
 *
 * OpenTelemetry의 현재 trace ID와 span ID를 가져오고,
 * Kafka 이벤트 전파 시 trace context를 복원하는 기능을 제공합니다.
 *
 * ## 변경 이력
 * - **2026-02-09** (Claude Opus 4 / claude-opus-4-6):
 *   Grafana Tempo 분산 추적 통합을 위해 전면 리팩토링.
 *   - `object` → `@Component class`로 변환 (micrometer Tracer DI 필요)
 *   - 정적 메서드(`getCurrentTraceId/SpanId`)를 `companion object`로 이동하여 기존 호출 호환성 유지
 *   - `executeWithRestoredTrace()`: raw OTel API(`GlobalOpenTelemetry.getTracer()`) 기반에서
 *     micrometer Tracer 기반으로 재작성 → Spring Kafka observation scope chain에 올바르게 등록
 *   - `setTraceContext()` 제거 (scope leak이 있던 dead code - `makeCurrent()` 후 close 안 함)
 *   - `getCurrentTraceId()/getCurrentSpanId()`에 **SLF4J MDC fallback** 추가 (3차 시도):
 *     Kafka consumer observation 환경에서 micrometer `currentSpan()`과 OTel `Span.current()` 모두
 *     null/invalid를 반환하지만, Spring Boot의 `ObservationThreadLocalAccessor`가 MDC에는
 *     `traceId`/`spanId` 값을 정상적으로 설정하는 것을 확인.
 *     → `MDC.get("traceId")`를 최종 fallback으로 사용하여 PaymentProcess에 trace context 저장 성공.
 *   - companion object에서 micrometer Tracer 접근을 위한 `@Volatile tracerInstance` 패턴 도입:
 *     `init` 블록에서 DI받은 micrometerTracer를 static reference에 저장.
 *
 * ## 아키텍처 컨텍스트
 * ```
 * [HTTP 요청 / @Scheduled 스케줄러]
 *   └── Spring Observation → micrometer scope chain에 parent trace 등록
 *       └── 이 클래스의 메서드 호출
 *           ├── getCurrentTraceId/SpanId() → OutboxEventRecorder가 이벤트 메타데이터에 저장
 *           └── executeWithRestoredTrace() → OutboxEventProcessor/Webhook에서 원본 trace 복원
 *               └── micrometer Tracer로 span 생성 → Spring Kafka observation이 traceparent 주입
 * ```
 *
 * ## 사용 사례
 * 1. **이벤트 발행 시** (companion object 정적 메서드):
 *    `OutboxEventRecorder`가 도메인 이벤트를 OutboxEvent로 저장할 때,
 *    현재 trace ID/span ID를 이벤트 메타데이터에 포함시킴.
 *    이 값은 나중에 `executeWithRestoredTrace()`에서 parent로 사용됨.
 *
 * 2. **비동기 경계에서 trace 복원** (인스턴스 메서드):
 *    - `OutboxEventProcessor` (@Scheduled): DB에서 읽은 traceId/spanId로 원본 trace에 자식 span 생성
 *    - `PaymentGatewayClientProtocolCore` (Webhook): PaymentProcess에 저장된 traceId/spanId로 원본 trace 복원
 *
 * ## 핵심: micrometer Tracer를 사용하는 이유
 * Spring Boot 3.x + Spring Kafka 3.x의 observation 체계에서:
 * - `kafkaTemplate.send()`는 micrometer의 scope chain에서 현재 span을 찾아 traceparent 헤더를 주입함
 * - raw OTel API(`GlobalOpenTelemetry.getTracer().spanBuilder()`)로 만든 span은
 *   OTel Context에만 등록되고 micrometer scope chain에는 등록되지 않음
 * - 따라서 micrometer Tracer(`io.micrometer.tracing.Tracer`)를 통해 span을 생성해야
 *   `micrometer-tracing-bridge-otel`이 양쪽 scope chain에 모두 등록하여
 *   Kafka 헤더에 올바른 traceparent가 주입됨
 *
 * @see com.hamsterworld.common.web.kafka.OutboxEventProcessor 스케줄러에서의 trace 복원 사용처
 * @see com.hamsterworld.common.web.kafka.OutboxEventRecorder traceId/spanId 저장 사용처
 * @see com.hamsterworld.cashgateway.external.paymentgateway.abs.PaymentGatewayClientProtocolCore Webhook에서의 trace 복원 사용처
 */
@Component
class TraceContextHolder(
    private val micrometerTracer: MicrometerTracer
) {

    init {
        // companion object에서 micrometer Tracer를 사용할 수 있도록 static reference 설정
        // Spring Bean 초기화 시 한 번만 실행됨
        tracerInstance = micrometerTracer
    }

    companion object {
        private val log = LoggerFactory.getLogger(TraceContextHolder::class.java)

        // [2026-02-09] Claude Opus 4: micrometer Tracer static reference
        // companion object의 getCurrentTraceId/SpanId()에서 micrometer Tracer를 사용하기 위함.
        // OTel Span.current()가 Kafka consumer observation 환경에서 invalid를 반환하는 문제 해결.
        // micrometer Tracer는 자신의 scope chain에서 현재 span을 정확하게 찾을 수 있음.
        @Volatile
        private var tracerInstance: MicrometerTracer? = null

        /**
         * 현재 trace ID 가져오기
         *
         * 3단계 fallback 전략으로 trace ID를 획득:
         * 1. micrometer Tracer (`tracerInstance?.currentSpan()`) - Spring observation scope chain
         * 2. OTel raw API (`Span.current()`) - 직접 OTel span을 생성한 경우
         * 3. SLF4J MDC (`MDC.get("traceId")`) - Kafka consumer observation 환경 최종 fallback
         *
         * [2026-02-09] Claude Opus 4:
         * Kafka consumer observation 환경에서는 1차(micrometer)와 2차(OTel) 모두
         * null/invalid를 반환하지만, Spring Boot의 ObservationThreadLocalAccessor가
         * MDC에는 traceId를 정상 설정함. 3차 MDC fallback이 실제로 사용되는 주요 경로임.
         *
         * @return trace ID (32자 hex 문자열) 또는 null
         */
        @JvmStatic
        fun getCurrentTraceId(): String? {
            return try {
                // 1차: micrometer Tracer에서 가져오기 (Spring observation scope chain)
                tracerInstance?.currentSpan()?.context()?.traceId()?.let { traceId ->
                    if (traceId.isNotBlank()) return traceId
                }

                // 2차: OTel raw API (직접 OTel span을 생성한 경우)
                val span = Span.current()
                val spanContext = span.spanContext
                if (spanContext.isValid) {
                    return spanContext.traceId
                }

                // 3차 fallback: SLF4J MDC
                // Spring Boot 3.x + micrometer-tracing-bridge-otel은
                // observation scope 내에서 MDC에 "traceId" 키로 값을 설정함.
                // micrometer API와 OTel API 모두 현재 span을 반환하지 못하는 환경에서도
                // MDC에는 값이 존재할 수 있음 (Kafka consumer observation 등).
                MDC.get("traceId")?.takeIf { it.isNotBlank() }
            } catch (e: Exception) {
                log.warn("Failed to get current trace ID", e)
                null
            }
        }

        /**
         * 현재 span ID 가져오기
         *
         * 3단계 fallback 전략으로 span ID를 획득:
         * 1. micrometer Tracer → 2. OTel raw API → 3. SLF4J MDC
         * (상세 설명은 [getCurrentTraceId] 참고)
         *
         * [2026-02-09] Claude Opus 4: MDC fallback 추가 (getCurrentTraceId와 동일한 이유)
         *
         * @return span ID (16자 hex 문자열) 또는 null
         */
        @JvmStatic
        fun getCurrentSpanId(): String? {
            return try {
                // 1차: micrometer Tracer에서 가져오기
                tracerInstance?.currentSpan()?.context()?.spanId()?.let { spanId ->
                    if (spanId.isNotBlank()) return spanId
                }

                // 2차: OTel raw API
                val span = Span.current()
                val spanContext = span.spanContext
                if (spanContext.isValid) {
                    return spanContext.spanId
                }

                // 3차 fallback: SLF4J MDC
                MDC.get("spanId")?.takeIf { it.isNotBlank() }
            } catch (e: Exception) {
                log.warn("Failed to get current span ID", e)
                null
            }
        }
    }

    /**
     * 명시적 span 생성 (비동기 경계용)
     *
     * OTel 자동 계측이 새 trace를 만들어버리는 스케줄러/콜백 환경에서,
     * 원본 trace의 자식 span을 **명시적으로** 생성합니다.
     *
     * ## 변경 이력
     * - **2026-02-09** (Claude Opus 4):
     *   raw OTel API 기반 → micrometer Tracer 기반으로 재작성.
     *   기존 구현은 `GlobalOpenTelemetry.getTracer("common").spanBuilder()`로 span을 생성했으나,
     *   이 방식은 OTel Context에만 span이 등록되고 micrometer scope chain에는 등록되지 않아
     *   Spring Kafka observation이 traceparent를 주입할 때 스케줄러의 trace를 사용하는 문제가 있었음.
     *
     * ## 동작 원리 (2단계 scope 설정)
     * ```
     * Step 1: OTel remote parent context 설정
     *   └── SpanContext.createFromRemoteParent(traceId, spanId)
     *   └── Context.current().with(Span.wrap(remoteSpanContext)).makeCurrent()
     *   └── 결과: OTel Context에 원본 trace가 parent로 등록됨
     *
     * Step 2: micrometer Tracer로 span 생성
     *   └── micrometerTracer.nextSpan().name(spanName).start()
     *   └── micrometer-tracing-bridge-otel이 Step 1에서 설정한 OTel parent를 읽음
     *   └── 결과: 원본 traceId를 가진 자식 span이 micrometer scope chain에도 등록됨
     *
     * Step 3: block 실행 (kafkaTemplate.send() 등)
     *   └── Spring Kafka observation이 micrometer scope에서 현재 span을 찾음
     *   └── 결과: Kafka 헤더에 올바른 traceparent (원본 traceId) 주입됨
     * ```
     *
     * ## 사용 사례
     * - **OutboxEventProcessor** (@Scheduled, spanName="outbox-relay"):
     *   DB의 OutboxEvent에 저장된 traceId/spanId로 자식 span 생성 → `kafkaTemplate.send()`
     * - **PaymentGatewayClientProtocolCore** (Webhook, spanName="webhook-callback"):
     *   PaymentProcess에 저장된 traceId/spanId로 원본 결제 요청 trace에 연결 → 이벤트 발행
     *
     * ## 주의사항
     * - traceId 또는 parentSpanId가 null이면 span을 생성하지 않고 block을 바로 실행함 (graceful degradation)
     * - OTel scope와 micrometer scope를 모두 올바르게 close해야 scope leak 방지됨
     *   (try-finally 블록으로 보장)
     *
     * @param spanName 생성할 span의 이름 (예: "outbox-relay", "webhook-callback")
     * @param traceId 원본 trace ID (32자 hex, OutboxEvent.traceId 또는 PaymentProcess.traceId)
     * @param parentSpanId 원본 parent span ID (16자 hex, OutboxEvent.spanId 또는 PaymentProcess.spanId)
     * @param block Span scope 안에서 실행할 코드 (kafkaTemplate.send(), 이벤트 핸들링 등)
     * @return block의 반환값
     */
    fun <T> executeWithRestoredTrace(
        spanName: String,
        traceId: String?,
        parentSpanId: String?,
        block: () -> T
    ): T {
        if (traceId == null || parentSpanId == null) {
            log.warn("Cannot create span: missing traceId={} or spanId={}", traceId, parentSpanId)
            return block()
        }

        try {
            // 1. OTel remote parent context 설정
            //    원본 trace의 traceId/spanId로 remote parent를 만들어 OTel Context에 등록
            val remoteSpanContext = SpanContext.createFromRemoteParent(
                traceId,
                parentSpanId,
                TraceFlags.getSampled(),
                TraceState.getDefault()
            )
            val parentContext = Context.current().with(Span.wrap(remoteSpanContext))
            val otelScope = parentContext.makeCurrent()

            try {
                // 2. micrometer Tracer로 span 생성
                //    micrometer-tracing-bridge-otel이 OTel Context에서 parent를 읽어
                //    올바른 traceId를 가진 자식 span을 생성함
                val span = micrometerTracer.nextSpan().name(spanName).start()
                val spanInScope = micrometerTracer.withSpan(span)

                log.debug("Created micrometer span '{}' as child of traceId={}, parentSpanId={}", spanName, traceId, parentSpanId)

                return try {
                    block()
                } finally {
                    span.end()
                    spanInScope.close()
                }
            } finally {
                otelScope.close()
            }
        } catch (e: Exception) {
            log.error("Failed to execute with restored trace: spanName={}, traceId={}, spanId={}",
                spanName, traceId, parentSpanId, e)
            throw e
        }
    }
}
