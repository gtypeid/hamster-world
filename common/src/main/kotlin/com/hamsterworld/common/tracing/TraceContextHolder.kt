package com.hamsterworld.common.tracing

import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanContext
import io.opentelemetry.api.trace.TraceFlags
import io.opentelemetry.api.trace.TraceState
import io.opentelemetry.context.Context
import org.slf4j.LoggerFactory

/**
 * OpenTelemetry Trace Context 헬퍼
 *
 * OpenTelemetry의 현재 trace ID와 span ID를 가져오고,
 * Kafka 이벤트 전파 시 trace context를 복원하는 기능을 제공합니다.
 *
 * ## 사용 사례:
 * 1. 이벤트 발행 시: 현재 trace ID를 이벤트 메타데이터에 포함
 * 2. 이벤트 수신 시: 메타데이터의 trace ID로 span 생성하여 trace 연결
 */
object TraceContextHolder {
    private val log = LoggerFactory.getLogger(TraceContextHolder::class.java)

    /**
     * 현재 OpenTelemetry trace ID 가져오기
     *
     * @return trace ID (32자 hex 문자열) 또는 null
     */
    fun getCurrentTraceId(): String? {
        return try {
            val span = Span.current()
            val spanContext = span.spanContext

            if (spanContext.isValid) {
                spanContext.traceId
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to get current trace ID", e)
            null
        }
    }

    /**
     * 현재 OpenTelemetry span ID 가져오기
     *
     * @return span ID (16자 hex 문자열) 또는 null
     */
    fun getCurrentSpanId(): String? {
        return try {
            val span = Span.current()
            val spanContext = span.spanContext

            if (spanContext.isValid) {
                spanContext.spanId
            } else {
                null
            }
        } catch (e: Exception) {
            log.warn("Failed to get current span ID", e)
            null
        }
    }

    /**
     * Trace context를 현재 스레드에 설정 (Kafka consumer용)
     *
     * Kafka consumer에서 이벤트 수신 시, 메타데이터의 trace ID + span ID를 사용하여
     * OpenTelemetry trace context를 복원하고, 새로운 span을 parent-child 관계로 연결합니다.
     *
     * **중요:** 단순히 같은 traceId를 로그에 찍는 게 아니라,
     * OTel의 Span.builder().setParent()로 실제 trace tree에 연결되어야
     * Grafana Tempo에서 하나의 trace로 보입니다.
     *
     * @param traceId 복원할 trace ID (32자 hex)
     * @param spanId 복원할 parent span ID (16자 hex)
     * @return 복원된 Context (null이면 실패)
     */
    fun setTraceContext(traceId: String?, spanId: String?): Context? {
        if (traceId == null || spanId == null) {
            log.debug("Cannot restore trace context: traceId={}, spanId={}", traceId, spanId)
            return null
        }

        return try {
            // Remote parent SpanContext 생성
            val remoteSpanContext = SpanContext.createFromRemoteParent(
                traceId,
                spanId,
                TraceFlags.getSampled(), // 샘플링 플래그 (100% sampling)
                TraceState.getDefault()
            )

            // Parent context 생성 및 현재 context로 설정
            val parentContext = Context.current().with(Span.wrap(remoteSpanContext))
            val scope = parentContext.makeCurrent()

            log.debug("Trace context restored: traceId={}, parentSpanId={}", traceId, spanId)

            parentContext
        } catch (e: Exception) {
            log.warn("Failed to restore trace context: traceId={}, spanId={}", traceId, spanId, e)
            null
        }
    }

    /**
     * Trace context 정보 로깅 (디버깅용)
     */
    fun logCurrentTraceContext() {
        val traceId = getCurrentTraceId()
        val spanId = getCurrentSpanId()
        log.debug("Current trace context: traceId={}, spanId={}", traceId, spanId)
    }
}
