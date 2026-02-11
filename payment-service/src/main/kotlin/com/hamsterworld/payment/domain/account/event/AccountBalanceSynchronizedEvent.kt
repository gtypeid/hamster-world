package com.hamsterworld.payment.domain.account.event

import com.hamsterworld.payment.web.event.PaymentDomainEvent
import com.hamsterworld.common.tracing.TraceContextHolder
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * 잔액 동기화 이벤트 (Kafka 전송용 이벤트)
 *
 * Payment Service → 구독 서비스 (Kafka)
 *
 * ## 목적
 * - Payment Service의 잔액 변경을 외부 서비스에 전파
 * - 구독 서비스(E-commerce 등)의 포인트 잔액 동기화
 *
 * ## 발행 시점
 * - Account.updateBalanceByDelta() 호출 시 registerEvent()로 등록
 * - OutboxEventProcessor가 Kafka로 전송
 *
 * ## 처리 흐름
 * ```
 * 1. Account.updateBalanceByDelta() → InternalAccountBalanceChangedEvent (내부)
 * 2. Account.updateBalanceByDelta() → AccountBalanceSynchronizedEvent (Kafka)
 * 3. AccountEventHandler.handle() → AccountRecord 생성
 * 4. OutboxEventProcessor → Kafka 전송
 * 5. 구독 서비스 Consumer → 잔액 동기화
 * ```
 *
 * @see ProductStockSynchronizedEvent 동일 패턴
 */
data class AccountBalanceSynchronizedEvent(
    val accountPublicId: String,      // Payment Service Account의 Public ID (Snowflake Base62)
    val userPublicId: String,         // User Public ID (Snowflake Base62)
    val accountType: String,          // 계좌 유형 (CONSUMER, SELLER 등)
    val balance: BigDecimal,          // 현재 잔액 (절대값)
    val reason: String,               // 변경 사유
    // DomainEvent 메타데이터 (OpenTelemetry trace context)
    override val eventId: String = java.util.UUID.randomUUID().toString(),
    override val traceId: String? = TraceContextHolder.getCurrentTraceId(),
    override val spanId: String? = TraceContextHolder.getCurrentSpanId(),
    override val occurredAt: LocalDateTime = LocalDateTime.now()
) : PaymentDomainEvent(
    aggregateId = userPublicId,
    aggregateType = "Account",
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt
)
