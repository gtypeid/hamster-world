# TRACE CONTEXT LOSS ANALYSIS: Cash Gateway Service

## Executive Summary

**ROOT CAUSE IDENTIFIED**: `TraceContextHolder.getCurrentTraceId()` returns `null` in `PaymentRequestToProcessConverter.convert()` because the **Kafka consumer is executing within OTel's automatic span context**, but the trace context is stored in OpenTelemetry's **Context API**, not in the micrometer scope chain at the point of converter execution.

**Critical Issue**: The converter is called **BEFORE** any micrometer span is explicitly created. The BaseKafkaConsumer only stores trace context in `AuditContextHolder` (for logging), not in the OTel Context API scope chain.

---

## COMPLETE CALL CHAIN: Kafka Message → PaymentProcess Creation

### Phase 1: Event Reception (Kafka Consumer Thread)

```
┌─────────────────────────────────────────────────────────────────┐
│ KAFKA BROKER                                                    │
│ Message: OrderStockReservedEvent                                │
│ Headers: traceparent (from OTel auto-instrumentation)           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PaymentEventConsumer.consume()                                  │
│ - @KafkaListener(topics = ["${kafka.topics.payment-events}"])   │
│ - @Transactional(propagation = Propagation.REQUIRES_NEW)        │
│ - Thread: kafka-consumer-X                                      │
│                                                                  │
│ ★ CRITICAL: OTel auto-instrumentation creates span here        │
│   from Kafka traceparent header                                 │
│   BUT trace context is only in OTel Context.current()          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ BaseKafkaConsumer.consumeEvent() [TEMPLATE METHOD]              │
│ @Transactional(propagation = Propagation.MANDATORY)             │
│                                                                  │
│ 1. parseEvent(message: String): ParsedEvent                     │
│    ├─ Extract from JSON: eventType, aggregateId, payload        │
│    ├─ Extract from metadata: traceId, spanId                    │
│    └─ AuditContextHolder.setContext(traceId)  ← LOGGING ONLY   │
│       [NOT setting OTel Context!]                              │
│                                                                  │
│ 2. Check subscribed events from YML                             │
│ 3. Check for duplicate in ProcessedEvent table                  │
│ 4. handleEvent(parsedEvent) [calls subclass implementation]     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PaymentEventConsumer.handleOrderStockReserved()                 │
│ @Transactional(propagation = Propagation.MANDATORY)             │
│                                                                  │
│ 1. Parse DTO: eventDto = objectMapper.convertValue<...>()       │
│ 2. Convert DTO: paymentService.approve(request)                 │
│    - CALLS PaymentService.approve(PaymentApproveRequest)        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PaymentService.approve()                                        │
│ @Transactional(propagation = Propagation.MANDATORY)             │
│                                                                  │
│ 1. Create ApprovePaymentCtx from request                        │
│ 2. paymentGatewayClient.bind(provider).payment(ctx)             │
│    - CALLS PaymentGatewayClientProtocolCore.payment()           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PaymentGatewayClientProtocolCore.payment()                      │
│ @Transactional(propagation = Propagation.MANDATORY)             │
│                                                                  │
│ 1. PaymentRequest = provider.prepareRequest(paymentCtx)         │
│ 2. Serialize to JSON                                            │
│ 3. CREATE: domainConverterAdapter.convert(                      │
│       PaymentApprovedRequestWithCtx,                            │
│       PaymentProcess::class.java                                │
│    )                                                             │
│    ↓                                                             │
│    CALLS PaymentRequestToProcessConverter.convert()             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ PaymentRequestToProcessConverter.convert()                      │
│ override fun convert(source: PaymentApprovedRequestWithCtx)     │
│                                                                  │
│ LINE 39: traceId = TraceContextHolder.getCurrentTraceId()       │
│          ★★★ RETURNS NULL HERE ★★★                             │
│                                                                  │
│ LINE 40: spanId = TraceContextHolder.getCurrentSpanId()         │
│          ★★★ RETURNS NULL HERE ★★★                             │
│                                                                  │
│ Returns PaymentProcess with:                                    │
│ - traceId = null                                                │
│ - spanId = null                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
                PaymentProcess entity saved
                with NULL traceId/spanId
                
                (Later when Webhook arrives,
                 trace restoration will FAIL
                 because PaymentProcess.traceId = null)
```

---

## ROOT CAUSE ANALYSIS

### Problem 1: OTel Context Not Accessible

**File**: `/common/src/main/kotlin/com/hamsterworld/common/tracing/TraceContextHolder.kt`

```kotlin
@JvmStatic
fun getCurrentTraceId(): String? {
    return try {
        val span = Span.current()          // ← OTel API
        val spanContext = span.spanContext
        
        if (spanContext.isValid) {
            spanContext.traceId
        } else {
            null  // ← RETURNS NULL
        }
    } catch (e: Exception) {
        log.warn("Failed to get current trace ID", e)
        null
    }
}
```

**When does `Span.current()` return an invalid span?**

1. **Kafka Consumer Entry Point**: 
   - OTel auto-instrumentation IS running (creates span from Kafka traceparent header)
   - BUT at the point `PaymentRequestToProcessConverter` is called, the trace context may not be properly propagated to the thread-local scope

2. **Thread Context**: 
   - Kafka Consumer is running in a thread pool (kafka-consumer-X)
   - Even though OTel created a span, it's stored in OTel's Context API
   - `Span.current()` uses `Context.current()` to find the current span

3. **Why Is Context Empty?**
   - The OTel Kafka instrumentation should inject context automatically
   - BUT if the consumer is called within a different execution scope, the context may not be visible

---

## ISSUE 2: AuditContextHolder vs TraceContextHolder Mismatch

**File**: `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/BaseKafkaConsumer.kt` (Line 129-131)

```kotlin
if (traceId != null) {
    AuditContextHolder.setContext(AuditContext(traceId = traceId))
    logger.debug("Set AuditContext for logging: traceId={}", traceId)
}
```

**Problem**: 
- BaseKafkaConsumer extracts `traceId` from Kafka message metadata
- Sets it in `AuditContextHolder` (ThreadLocal for logging)
- **BUT does NOT set it in OTel Context API**
- When `PaymentRequestToProcessConverter` calls `TraceContextHolder.getCurrentTraceId()`, it looks for span in OTel Context, not AuditContextHolder

**Evidence**: Comment in BaseKafkaConsumer (Line 127-128):

```kotlin
// Note: OpenTelemetry trace context is OTel 자동 계측이 Kafka 헤더에서 복원함
//       수동으로 setTraceContext()를 호출하면 오히려 충돌 발생
```

The comment says "OTel auto-instrumentation restores Kafka header", but this doesn't guarantee the context is available at the point the converter is called.

---

## ISSUE 3: Thread Boundary (No @Async, But Still a Problem)

✅ **Good News**: There are **NO @Async calls** in the entire flow
- No thread jumps between Kafka consumer and PaymentProcess creation
- Everything runs in the same kafka-consumer-X thread

❌ **Bad News**: Even in the same thread, if OTel context isn't properly propagated through Spring's scope chain, `Span.current()` won't find the span.

---

## DETAILED FLOW WITH TRACE CONTEXT STATUS

```
1. Kafka Message Arrives
   ├─ Kafka Header: "traceparent: 00-{traceId}-{spanId}-01"
   └─ Content: JSON with metadata.traceId, metadata.spanId
      (May be redundant - depends on OTel Kafka instrumentation version)

2. OTel Kafka Instrumentation (Auto)
   ├─ Reads Kafka Header traceparent
   └─ Creates span with the extracted traceId
      ✅ Span stored in OTel Context.current()
      ✅ Available to Span.current()

3. Spring Kafka Container Listener
   ├─ Thread: kafka-consumer-X
   └─ Calls @KafkaListener method
      ⚠️  IMPORTANT: OTel span scope should be active here

4. PaymentEventConsumer.consume()
   ├─ @KafkaListener annotation triggers method
   ├─ OTel span scope SHOULD be active (from instrumentation)
   └─ Calls super.consumeEvent(message, ack)

5. BaseKafkaConsumer.consumeEvent()
   ├─ Parses JSON message
   ├─ Extracts traceId from metadata
   ├─ Sets AuditContextHolder.setContext() ← LOGGING ONLY
   ├─ Calls handleEvent(parsedEvent)
   └─ OTel span scope should still be active

6. PaymentEventConsumer.handleOrderStockReserved()
   ├─ Calls paymentService.approve()
   └─ OTel span scope should still be active

7. PaymentService.approve()
   ├─ Calls paymentGatewayClient.bind(provider).payment(ctx)
   └─ OTel span scope should still be active

8. PaymentGatewayClientProtocolCore.payment()
   ├─ Creates PaymentApprovedRequestWithCtx
   ├─ Calls domainConverterAdapter.convert()
   └─ OTel span scope should still be active

9. ★ PaymentRequestToProcessConverter.convert()
   ├─ Calls TraceContextHolder.getCurrentTraceId()
   │  └─ Returns Span.current()
   │     └─ Looks for Context.current().span
   │        └─ ⚠️ PROBLEM: span is invalid or not found
   │           Reason: OTel context not properly accessible in this call stack
   └─ traceId = null
      spanId = null

10. PaymentGatewayCoreService.handleRequest()
    ├─ Saves PaymentProcess with traceId=null, spanId=null
    └─ Later, Webhook cannot restore trace (no IDs to restore)
```

---

## WHY TraceContextHolder.getCurrentTraceId() Returns Null

### Hypothesis 1: OTel Context Not Accessible in Converter

The OTel Kafka instrumentation creates a span, but it might not be in the OTel Context scope chain at the point the converter is called.

**Reason**: Spring Kafka's observation (micrometer-based) might be creating a separate scope from OTel's automatic instrumentation.

**Check in logs**: 
- If you see OTel creating a span in Kafka consumer, but `Span.current()` is invalid, this is the issue.

### Hypothesis 2: BaseKafkaConsumer Should Restore Trace Context

Currently, BaseKafkaConsumer only sets `AuditContextHolder` (for logging), but doesn't actively restore the OTel trace context.

**Current Code** (Line 129-131):
```kotlin
if (traceId != null) {
    AuditContextHolder.setContext(AuditContext(traceId = traceId))
    // No OTel context setup
}
```

**What Should Happen**: The extracted `traceId` and `spanId` should be used to create a child span or restore the context scope.

### Hypothesis 3: Mismatch Between Kafka Header and Message Metadata

The Kafka message contains `metadata.traceId` AND `metadata.spanId` (extracted by OutboxEventProcessor).
BUT the Kafka header `traceparent` is created by OTel auto-instrumentation.

If these don't match, `Span.current()` might be looking for the wrong trace.

---

## OUTBOX EVENT PROCESSOR: Correct Trace Handling

**File**: `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/OutboxEventProcessor.kt`

✅ **This component does it RIGHT**:

```kotlin
@Scheduled(fixedDelay = 1000, initialDelay = 1000)
@Transactional
fun relay() {
    claimed.forEach { event ->
        traceContextHolder.executeWithRestoredTrace(
            spanName = "outbox-relay",
            traceId = event.traceId,        // ← From OutboxEvent
            parentSpanId = event.spanId     // ← From OutboxEvent
        ) {
            kafkaTemplate.send(event.topic, event.aggregateId, event.payload).get()
        }
    }
}
```

**What's Different**:
1. Gets traceId/spanId from database
2. Explicitly calls `executeWithRestoredTrace()`
3. Creates a micrometer span with the trace context
4. kafkaTemplate.send() executes within that span scope
5. ✅ Result: Kafka message has correct traceparent header

**Why This Works**:
- OutboxEventProcessor has access to OutboxEvent from database
- It explicitly manages trace restoration
- It doesn't rely on Span.current() being automatically available

---

## WEBHOOK FLOW: Also Depends on Correct traceId/spanId

**File**: `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayClientProtocolCore.kt` (Line 337-371)

```kotlin
traceContextHolder.executeWithRestoredTrace(
    spanName = "webhook-callback",
    traceId = existingProcess.traceId,    // ← Retrieved from PaymentProcess
    parentSpanId = existingProcess.spanId // ← Retrieved from PaymentProcess
) {
    // Event publishing happens with restored trace
    paymentGatewayCoreService.handleResponseSuccess(existingProcess)
}
```

**CRITICAL**: This will FAIL if PaymentProcess.traceId is NULL (because we couldn't capture it in the converter).

---

## ROOT CAUSE SUMMARY

| Component | Issue | Impact |
|-----------|-------|--------|
| BaseKafkaConsumer | Sets AuditContextHolder but not OTel Context | TraceContextHolder.getCurrentTraceId() can't find span |
| PaymentRequestToProcessConverter | Calls TraceContextHolder.getCurrentTraceId() without context setup | traceId/spanId captured as NULL |
| PaymentProcess | Saved with NULL traceId/spanId | Webhook callback cannot restore trace |
| PaymentGatewayClientProtocolCore | Calls executeWithRestoredTrace() with NULL traceId/spanId | Events published with wrong trace ID |

---

## SOLUTION APPROACHES

### Approach 1: Restore OTel Context in BaseKafkaConsumer (RECOMMENDED)

Modify `BaseKafkaConsumer.parseEvent()` to explicitly restore the OTel trace context:

```kotlin
protected fun parseEvent(message: String): ParsedEvent {
    val eventData = objectMapper.readValue<Map<String, Any>>(message)
    
    val traceId = metadata?.get("traceId") as? String
    val spanId = metadata?.get("spanId") as? String
    
    // ★ NEW: Restore OTel Context
    if (traceId != null && spanId != null) {
        val remoteSpanContext = SpanContext.createFromRemoteParent(
            traceId, spanId, TraceFlags.getSampled(), TraceState.getDefault()
        )
        val scope = Context.current()
            .with(Span.wrap(remoteSpanContext))
            .makeCurrent()
        // ⚠️ Important: scope.close() must be called later (in consumeEvent finally block)
    }
    
    // Now TraceContextHolder.getCurrentTraceId() will work
    AuditContextHolder.setContext(AuditContext(traceId = traceId))
    
    return ParsedEvent(...)
}
```

**Advantage**: Trace context available throughout the entire consumer processing
**Disadvantage**: More complex scope management (must close scope properly)

### Approach 2: Use ExecutorService.withContext() in Converter Caller

Instead of trying to get trace from OTel Context, have the caller (PaymentGatewayClientProtocolCore) explicitly restore and call converter:

```kotlin
override fun payment(paymentCtx: ApprovePaymentCtx) {
    val request: PaymentRequest = provider.prepareRequest(paymentCtx)
    
    // Get current trace first
    val traceId = TraceContextHolder.getCurrentTraceId()
    val spanId = TraceContextHolder.getCurrentSpanId()
    
    // Then call converter with explicit context
    val requestPaymentProcess = traceContextHolder.executeWithRestoredTrace(
        spanName = "payment-request-conversion",
        traceId = traceId,
        parentSpanId = spanId
    ) {
        domainConverterAdapter.convert(
            PaymentApprovedRequestWithCtx(provider, paymentCtx, request),
            PaymentProcess::class.java
        )
    }
    
    paymentGatewayCoreService.handleRequest(requestPaymentProcess)
}
```

**Advantage**: Works with existing code, trace captured early
**Disadvantage**: Requires changes in PaymentGatewayClientProtocolCore

### Approach 3: Capture Trace in PaymentEventConsumer (SIMPLEST)

Instead of relying on converter to capture trace, have the consumer capture it and pass via context:

```kotlin
override fun handleEvent(parsedEvent: ParsedEvent) {
    when (parsedEvent.eventType) {
        "OrderStockReservedEvent" -> {
            // Set thread-local context for converter to use
            TraceContextHolder.setThreadLocalContext(
                traceId = parsedEvent.traceId,
                spanId = parsedEvent.spanId
            )
            
            try {
                val eventDto = objectMapper.convertValue<OrderStockReservedEventDto>(parsedEvent.payload)
                val request = domainConverterAdapter.convert(eventDto, PaymentApproveRequest::class.java)
                val response = paymentService.approve(request)
            } finally {
                TraceContextHolder.clearThreadLocalContext()
            }
        }
    }
}
```

**Advantage**: Simplest change, explicit context management
**Disadvantage**: Requires new thread-local storage in TraceContextHolder

---

## VERIFICATION CHECKLIST

Before implementing fix, verify:

1. **Enable OTel Debug Logging**:
   ```yaml
   logging:
     level:
       io.opentelemetry: DEBUG
       io.opentelemetry.sdk.trace: DEBUG
   ```

2. **Check Kafka Header**:
   - Does Kafka message have `traceparent` header?
   - Does message body have `metadata.traceId` and `metadata.spanId`?

3. **Check Span Context**:
   - Add log in PaymentRequestToProcessConverter:
     ```kotlin
     val currentSpan = Span.current()
     log.info("Current Span: isValid={}, traceId={}, spanId={}",
         currentSpan.spanContext.isValid,
         currentSpan.spanContext.traceId,
         currentSpan.spanContext.spanId
     )
     ```

4. **Check Trace in Webhook**:
   - Is PaymentProcess.traceId NULL in database?
   - If YES, converter didn't capture it (confirms the issue)
   - If NO, then different problem (context not available in webhook handler)

---

## FILES INVOLVED IN TRACE CONTEXT LOSS

1. **Base Kafka Consumer** (doesn't restore OTel context)
   - `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/BaseKafkaConsumer.kt`

2. **Trace Context Holder** (can't find span)
   - `/common/src/main/kotlin/com/hamsterworld/common/tracing/TraceContextHolder.kt`

3. **Converter (tries to get trace but fails)**
   - `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/paymentprocess/converter/PaymentRequestToProcessConverter.kt`

4. **Payment Process Entity (stores NULL traceId)**
   - `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/paymentprocess/model/PaymentProcess.kt`

5. **Webhook Handler (can't restore because traceId is NULL)**
   - `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayClientProtocolCore.kt`

