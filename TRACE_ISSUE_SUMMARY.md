# Trace Context Loss: Executive Summary

## The Problem
`TraceContextHolder.getCurrentTraceId()` returns `null` when called in `PaymentRequestToProcessConverter.convert()` during Kafka event processing.

## Impact
- PaymentProcess entity is saved with `traceId=null` and `spanId=null`
- Later, when Webhook callback arrives, `PaymentGatewayClientProtocolCore.handleInternalWebhook()` cannot restore the original trace
- Distributed trace is broken: ecommerce → payment → cash-gateway spans are in different traces in Grafana Tempo

## Root Cause
**Two incompatible trace storage mechanisms:**

1. **Kafka Message Metadata** (Set by OutboxEventProcessor when publishing)
   - `metadata.traceId` = "00aa...ff" (32 hex chars)
   - `metadata.spanId` = "aa...ff" (16 hex chars)
   - Available in `ParsedEvent` after BaseKafkaConsumer parses the message
   - Used for logging via `AuditContextHolder.setContext(traceId)`

2. **OTel Context API** (Set by OTel Kafka auto-instrumentation)
   - Span created from Kafka `traceparent` header
   - Stored in `OTel Context.current()`
   - Should be accessible via `Span.current()`

**The Mismatch:**
- BaseKafkaConsumer extracts traceId from metadata but only sets `AuditContextHolder` (logging)
- `PaymentRequestToProcessConverter` tries to get traceId via `TraceContextHolder.getCurrentTraceId()` → `Span.current()` → `Context.current()`
- But `Span.current()` returns an invalid span (spanContext.isValid = false)
- Result: `traceId = null`, `spanId = null`

## Evidence

### File 1: BaseKafkaConsumer.kt (Lines 127-134)
```kotlin
// Comment says: "OTel 자동 계측이 Kafka 헤더에서 복원함"
// (OTel auto-instrumentation restores from Kafka header)
// BUT doesn't set the OTel Context scope!

if (traceId != null) {
    AuditContextHolder.setContext(AuditContext(traceId = traceId))
    // ← Only sets AuditContextHolder (ThreadLocal for logging)
    // ← Does NOT set OTel Context!
}
```

### File 2: TraceContextHolder.kt (Lines 74-88)
```kotlin
@JvmStatic
fun getCurrentTraceId(): String? {
    return try {
        val span = Span.current()  // ← Looks in OTel Context
        val spanContext = span.spanContext
        
        if (spanContext.isValid) {  // ← Returns false ❌
            spanContext.traceId
        } else {
            null  // ← RETURNS NULL
        }
    } catch (e: Exception) {
        null
    }
}
```

### File 3: PaymentRequestToProcessConverter.kt (Lines 39-40)
```kotlin
return PaymentProcess(
    // ... other fields
    traceId = TraceContextHolder.getCurrentTraceId(),  // ← Null ❌
    spanId = TraceContextHolder.getCurrentSpanId()     // ← Null ❌
)
```

### File 4: PaymentProcess entity (Saved to DB)
```kotlin
@Column(name = "trace_id", length = 32)
var traceId: String? = null  // ❌ STORED AS NULL

@Column(name = "span_id", length = 16)
var spanId: String? = null   // ❌ STORED AS NULL
```

### File 5: PaymentGatewayClientProtocolCore.kt (Lines 351-354)
```kotlin
// Later, Webhook tries to restore trace:
traceContextHolder.executeWithRestoredTrace(
    spanName = "webhook-callback",
    traceId = existingProcess.traceId,    // ← NULL ❌
    parentSpanId = existingProcess.spanId // ← NULL ❌
) {
    // ... trace restoration fails, events published with webhook's trace
}
```

## Why This Happens

### Scenario: No Thread Boundary
```
1. Kafka message arrives
2. OTel Kafka instrumentation creates span from traceparent header
3. Span scope is active (stored in OTel Context.current())
4. BaseKafkaConsumer.parseEvent():
   ├─ Extracts traceId from JSON metadata
   ├─ Sets AuditContextHolder (ThreadLocal)
   └─ ❌ Does NOT restore OTel Context scope explicitly
5. PaymentRequestToProcessConverter.convert():
   ├─ Calls Span.current()
   ├─ Looks in OTel Context
   └─ ❌ Can't find valid span (context lost or not accessible)
   └─ Returns NULL
```

### Hypothesis
- OTel auto-instrumentation creates a span from the Kafka header
- But there may be a scope management issue (span created but scope not active when converter is called)
- Or the span context is created but marked as non-sampled or invalid
- OR there's a timing issue with when the scope becomes active vs. when the converter is called

## What Works: OutboxEventProcessor

```kotlin
@Scheduled(fixedDelay = 1000)
fun relay() {
    claimed.forEach { event ->
        // ✅ EXPLICITLY restores trace context
        traceContextHolder.executeWithRestoredTrace(
            spanName = "outbox-relay",
            traceId = event.traceId,        // ← From database
            parentSpanId = event.spanId
        ) {
            kafkaTemplate.send(event.topic, event.aggregateId, event.payload).get()
        }
    }
}
```

**Why it works:**
- Retrieves traceId/spanId from OutboxEvent in database
- Explicitly creates micrometer span via `executeWithRestoredTrace()`
- kafkaTemplate.send() executes within that span scope
- ✅ Kafka message receives correct traceparent header

## Solutions (Ranked by Feasibility)

### Option 1: Capture Trace in Consumer (EASIEST)
**Location:** PaymentEventConsumer.handleOrderStockReserved()

```kotlin
override fun handleEvent(parsedEvent: ParsedEvent) {
    when (parsedEvent.eventType) {
        "OrderStockReservedEvent" -> {
            // Use the extracted traceId/spanId directly
            if (parsedEvent.traceId != null && parsedEvent.spanId != null) {
                traceContextHolder.executeWithRestoredTrace(
                    spanName = "order-stock-reserved",
                    traceId = parsedEvent.traceId,
                    parentSpanId = parsedEvent.spanId
                ) {
                    val eventDto = objectMapper.convertValue<OrderStockReservedEventDto>(parsedEvent.payload)
                    val request = domainConverterAdapter.convert(eventDto, PaymentApproveRequest::class.java)
                    paymentService.approve(request)
                }
            } else {
                // Fallback: process without trace restoration
                val eventDto = objectMapper.convertValue<OrderStockReservedEventDto>(parsedEvent.payload)
                val request = domainConverterAdapter.convert(eventDto, PaymentApproveRequest::class.java)
                paymentService.approve(request)
            }
        }
    }
}
```

**Pros:**
- Simple, minimal changes
- Trace context available throughout approve() chain
- Uses existing executeWithRestoredTrace() infrastructure

**Cons:**
- Requires changes in consumer (could affect other consumers too)

### Option 2: Restore OTel Context in BaseKafkaConsumer (RECOMMENDED FOR GENERAL SOLUTION)
**Location:** BaseKafkaConsumer.consumeEvent()

```kotlin
protected open fun consumeEvent(message: String, ack: Acknowledgment) {
    val parsedEvent = parseEvent(message)
    
    // Restore OTel context if traceId/spanId available
    if (parsedEvent.traceId != null && parsedEvent.spanId != null) {
        val remoteSpanContext = SpanContext.createFromRemoteParent(
            parsedEvent.traceId,
            parsedEvent.spanId,
            TraceFlags.getSampled(),
            TraceState.getDefault()
        )
        val scope = Context.current()
            .with(Span.wrap(remoteSpanContext))
            .makeCurrent()
        
        try {
            // Now TraceContextHolder.getCurrentTraceId() will work
            handleEvent(parsedEvent)
        } finally {
            scope.close()
        }
    } else {
        handleEvent(parsedEvent)
    }
}
```

**Pros:**
- Fixes the issue for all Kafka consumers
- Trace context available throughout event handling
- Explicit scope management ensures cleanup

**Cons:**
- More complex scope management
- Must ensure scope.close() is always called (use try-finally)

### Option 3: Pass Trace Context Through Converter (TARGETED FIX)
**Location:** PaymentGatewayClientProtocolCore.payment()

```kotlin
override fun payment(paymentCtx: ApprovePaymentCtx) {
    val request: PaymentRequest = provider.prepareRequest(paymentCtx)
    val jsonBody: String = objectMapper.writeValueAsString(request)
    
    // Get current trace BEFORE calling converter
    val currentTraceId = TraceContextHolder.getCurrentTraceId()
    val currentSpanId = TraceContextHolder.getCurrentSpanId()
    
    // Call converter within restored trace context
    val requestPaymentProcess = if (currentTraceId != null && currentSpanId != null) {
        traceContextHolder.executeWithRestoredTrace(
            spanName = "payment-request-conversion",
            traceId = currentTraceId,
            parentSpanId = currentSpanId
        ) {
            domainConverterAdapter.convert(
                PaymentApprovedRequestWithCtx(provider, paymentCtx, request),
                PaymentProcess::class.java
            )
        }
    } else {
        domainConverterAdapter.convert(
            PaymentApprovedRequestWithCtx(provider, paymentCtx, request),
            PaymentProcess::class.java
        )
    }
    
    paymentGatewayCoreService.handleRequest(requestPaymentProcess)
    // ... rest of the method
}
```

**Pros:**
- Minimal scope (only affects converter call)
- Targeted fix for the specific issue

**Cons:**
- More code duplication
- Only fixes this specific flow, not general problem

## Recommended Approach

**Use Option 1 (Capture Trace in Consumer)** for immediate fix.
**Implement Option 2 (BaseKafkaConsumer restoration)** for long-term solution.

Why:
1. Option 1 is quick to implement and works
2. Option 2 fixes all Kafka consumers, not just this one
3. Both can coexist (double restoration won't hurt)

## Testing Checklist

After implementing the fix:

1. **Enable OTel Debug Logging:**
   ```yaml
   logging:
     level:
       io.opentelemetry: DEBUG
       io.opentelemetry.sdk.trace: DEBUG
   ```

2. **Verify PaymentProcess.traceId is Captured:**
   ```sql
   SELECT id, traceId, spanId FROM payment_processes WHERE orderPublicId = 'xxx' LIMIT 1;
   ```
   Should show non-NULL traceId and spanId.

3. **Check Distributed Trace in Grafana Tempo:**
   - Start a payment flow
   - Go to Grafana Tempo
   - Search by trace ID from PaymentProcess
   - Should show: ecommerce-service → cash-gateway-service → payment-service
   - All in same trace tree (not separate traces)

4. **Verify Webhook Trace Restoration:**
   - Trigger webhook callback
   - Check logs for: "Created micrometer span 'webhook-callback' as child of traceId=..."
   - Verify events published have correct traceId in Kafka headers

## Files to Modify

1. `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/BaseKafkaConsumer.kt`
   - Add OTel context restoration in consumeEvent()

2. `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/consumer/PaymentEventConsumer.kt`
   - Add executeWithRestoredTrace() wrapper in handleOrderStockReserved()

3. (Optional) `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayClientProtocolCore.kt`
   - Add context restoration around converter call

## Timeline

- Quick Fix (Option 1): 1-2 hours
- General Solution (Option 2): 2-3 hours
- Testing & Verification: 1-2 hours
- Total: 4-7 hours

