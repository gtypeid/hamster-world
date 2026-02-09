# Trace Context Loss Debugging - Complete Index

This directory contains a comprehensive analysis of why `TraceContextHolder.getCurrentTraceId()` returns `null` in the cash-gateway-service Kafka consumer flow.

## Documents

### 1. TRACE_ISSUE_SUMMARY.md (START HERE)
**Best for:** Quick understanding of the problem
- 1-page executive summary
- Root cause explanation
- 3 solution options with code examples
- Testing checklist

**Time to read:** 5-10 minutes

### 2. TRACE_CONTEXT_ANALYSIS.md (DETAILED)
**Best for:** Deep dive into the architecture
- Complete call chain from Kafka message to PaymentProcess
- Root cause analysis with 3 hypotheses
- Comparison with working components (OutboxEventProcessor)
- Solution approaches with pros/cons
- Verification checklist

**Time to read:** 20-30 minutes

### 3. TRACE_FLOW_DIAGRAM.txt (VISUAL)
**Best for:** Understanding the exact data flow
- ASCII diagram of complete execution flow
- Each component's trace context status (✅/❌)
- Exact line numbers and code snippets
- "Key Insights" section explaining the mismatch
- Webhook callback failure scenario

**Time to read:** 15-20 minutes

## Quick Diagnosis

If you want to quickly verify this is the issue:

1. **Check the database:**
   ```sql
   SELECT id, traceId, spanId FROM payment_processes LIMIT 5;
   ```
   If `traceId` and `spanId` columns are NULL, you've found it.

2. **Check the code:**
   ```kotlin
   // PaymentRequestToProcessConverter.kt, line 39-40
   traceId = TraceContextHolder.getCurrentTraceId()  // Returns NULL
   spanId = TraceContextHolder.getCurrentSpanId()    // Returns NULL
   ```

3. **Check for broken traces:**
   - Open Grafana Tempo
   - Search for any payment trace
   - If the Webhook span is in a completely different trace, this is your issue

## The Core Problem (One Sentence)

`BaseKafkaConsumer` extracts `traceId` from message metadata and sets `AuditContextHolder` (for logging), but `PaymentRequestToProcessConverter` tries to get it from OTel Context API via `Span.current()`, which is empty or invalid.

## The Solution (Simplest)

Wrap the business logic in `PaymentEventConsumer.handleOrderStockReserved()` with `traceContextHolder.executeWithRestoredTrace()` using the traceId/spanId from `ParsedEvent`.

See TRACE_ISSUE_SUMMARY.md "Option 1: Capture Trace in Consumer" for code.

## Files Involved

### Critical Path (Where the problem occurs):

1. `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/BaseKafkaConsumer.kt`
   - Line 108-147: `parseEvent()` method extracts traceId from message
   - Line 129-131: Sets AuditContextHolder (but not OTel Context)
   - Line 188-275: `consumeEvent()` template method

2. `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/consumer/PaymentEventConsumer.kt`
   - Line 47-54: @KafkaListener entry point
   - Line 75-94: `handleOrderStockReserved()` - where fix should go

3. `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/paymentprocess/converter/PaymentRequestToProcessConverter.kt`
   - Line 39-40: Where traceId/spanId become NULL
   - This converter is called from PaymentGatewayClientProtocolCore.payment()

4. `/common/src/main/kotlin/com/hamsterworld/common/tracing/TraceContextHolder.kt`
   - Line 74-88: `getCurrentTraceId()` looks in OTel Context
   - Returns NULL when span is invalid

5. `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/domain/paymentprocess/model/PaymentProcess.kt`
   - Line 85-89: `traceId` and `spanId` fields
   - Saved as NULL due to converter returning NULL

6. `/cash-gateway-service/src/main/kotlin/com/hamsterworld/cashgateway/external/paymentgateway/abs/PaymentGatewayClientProtocolCore.kt`
   - Line 351-370: `handleInternalWebhook()` tries to restore trace
   - Fails because PaymentProcess.traceId is NULL

### Related Components (For Context):

7. `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/OutboxEventProcessor.kt`
   - Shows how to properly use `executeWithRestoredTrace()`
   - Why this component works when others don't

8. `/common/src/main/kotlin/com/hamsterworld/common/web/kafka/OutboxEventRecorder.kt`
   - Sets trace context when recording outbox events
   - Upstream of the Kafka consumer flow

## Implementation Checklist

### Before You Start:
- [ ] Read TRACE_ISSUE_SUMMARY.md (5 min)
- [ ] Review TRACE_FLOW_DIAGRAM.txt (10 min)
- [ ] Check if PaymentProcess.traceId is actually NULL in your DB

### Option 1: Quick Fix (Recommended)
- [ ] Add `traceContextHolder` field to PaymentEventConsumer
- [ ] Wrap `handleOrderStockReserved()` logic in `executeWithRestoredTrace()`
- [ ] Test: verify PaymentProcess.traceId is NOT NULL

### Option 2: General Fix (Better Long-term)
- [ ] Modify BaseKafkaConsumer.consumeEvent() to restore OTel context
- [ ] Add proper scope management with try-finally
- [ ] Test all consumers benefit from the fix

### Testing:
- [ ] Enable OTel debug logging
- [ ] Query database: SELECT traceId FROM payment_processes
- [ ] Check Grafana Tempo: traces should show complete flow
- [ ] Webhook callback: verify events in correct trace

## Expected Outcomes

### After Fix:
```sql
SELECT id, traceId, spanId FROM payment_processes WHERE orderPublicId = 'xxx';
-- Should show non-NULL traceId and spanId
```

### In Grafana Tempo:
```
Single trace showing:
├─ ecommerce-service (HTTP POST /orders)
│  └─ payment-service (Kafka consumer: OrderStockReservedEvent)
│     └─ cash-gateway-service (Kafka consumer: OrderStockReservedEvent)
│        └─ HTTP POST to PG
│           └─ Webhook callback (incoming HTTP from PG)
│              └─ Events published with correct traceId
```

## Key Learnings

1. **OTel Context is Thread-Local:** Even though OTel auto-instrumentation creates a span, it may not be accessible if the context scope isn't explicitly set.

2. **Two Trace Storage Systems:** Kafka message metadata and OTel Context API are separate. You need to bridge them.

3. **Explicit is Better Than Implicit:** `executeWithRestoredTrace()` explicitly creates spans, unlike relying on auto-instrumentation.

4. **Scope Management Matters:** OTel context scopes must be created and closed properly, typically with try-finally.

## Related Issues

If you see these, they're likely related:
- Webhook events in different trace than request events
- Kafka headers missing `traceparent`
- Grafana Tempo showing disconnected spans
- AuditContext has traceId but Span.current() returns invalid

## Questions?

Refer to:
- What is OTel Context? → See TraceContextHolder.kt line 1-60 (comments explain the architecture)
- Why executeWithRestoredTrace()? → See OutboxEventProcessor.kt line 133-152 (example of proper usage)
- What about @Async? → No @Async in the flow, everything runs in same thread
- Why does OutboxEventProcessor work? → See TRACE_CONTEXT_ANALYSIS.md "OUTBOX EVENT PROCESSOR" section

