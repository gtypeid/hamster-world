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
@Component
class TraceContextHolder(
    private val micrometerTracer: MicrometerTracer
) {
    init {
        tracerInstance = micrometerTracer
    }
    companion object {
        private val log = LoggerFactory.getLogger(TraceContextHolder::class.java)
        @Volatile
        private var tracerInstance: MicrometerTracer? = null
        @JvmStatic
        fun getCurrentTraceId(): String? {
            return try {
                tracerInstance?.currentSpan()?.context()?.traceId()?.let { traceId ->
                    if (traceId.isNotBlank()) return traceId
                }
                val span = Span.current()
                val spanContext = span.spanContext
                if (spanContext.isValid) {
                    return spanContext.traceId
                }
                MDC.get("traceId")?.takeIf { it.isNotBlank() }
            } catch (e: Exception) {
                log.warn("Failed to get current trace ID", e)
                null
            }
        }
        @JvmStatic
        fun getCurrentSpanId(): String? {
            return try {
                tracerInstance?.currentSpan()?.context()?.spanId()?.let { spanId ->
                    if (spanId.isNotBlank()) return spanId
                }
                val span = Span.current()
                val spanContext = span.spanContext
                if (spanContext.isValid) {
                    return spanContext.spanId
                }
                MDC.get("spanId")?.takeIf { it.isNotBlank() }
            } catch (e: Exception) {
                log.warn("Failed to get current span ID", e)
                null
            }
        }
    }
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
            val remoteSpanContext = SpanContext.createFromRemoteParent(
                traceId,
                parentSpanId,
                TraceFlags.getSampled(),
                TraceState.getDefault()
            )
            val parentContext = Context.current().with(Span.wrap(remoteSpanContext))
            val otelScope = parentContext.makeCurrent()
            try {
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
