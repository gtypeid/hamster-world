package com.hamsterworld.cashgateway.web.event

import com.hamsterworld.common.web.kafka.BaseDomainEvent
import com.hamsterworld.common.web.kafka.KafkaTopics
import java.time.LocalDateTime
import java.util.UUID

/**
 * Cash Gateway Service 도메인 이벤트 Base
 *
 * 상속받는 모든 이벤트는 자동으로 이 서비스가 소유한 Kafka 토픽으로 발행됩니다.
 *
 * 용도:
 * - 결제 승인 이벤트 (PaymentApprovedEvent)
 * - 결제 실패 이벤트 (PaymentFailedEvent)
 * - 결제 취소 이벤트 (PaymentCancelledEvent)
 *
 * ## aggregateType 조건부 분기 (2026-02-10, Claude Opus 4 / claude-opus-4-6)
 *
 * Cash Gateway는 범용 결제 게이트웨이로서 두 가지 결제 경로를 처리합니다:
 *
 * 1. **내부 거래** (Ecommerce 주문 기반):
 *    - Ecommerce → OrderCreatedEvent → Payment Service → CashGateway
 *    - `orderPublicId`가 존재 → aggregateId = orderPublicId, aggregateType = "Order"
 *
 * 2. **외부 거래** (주문 없는 독립 결제):
 *    - 외부 PG 연동 / Webhook → CashGateway 직접 결제 처리
 *    - `orderPublicId`가 null → aggregateId = paymentPublicId, aggregateType = "PaymentProcess"
 *
 * 따라서 하위 이벤트들의 aggregateId/aggregateType은 orderPublicId 존재 여부에 따라 조건부로 결정됩니다.
 */
abstract class CashGatewayDomainEvent(
    aggregateId: String,
    aggregateType: String,
    eventId: String = UUID.randomUUID().toString(),
    traceId: String? = null,
    spanId: String? = null,
    occurredAt: LocalDateTime = LocalDateTime.now()
) : BaseDomainEvent(
    aggregateId = aggregateId,
    aggregateType = aggregateType,
    eventId = eventId,
    traceId = traceId,
    spanId = spanId,
    occurredAt = occurredAt,
    topic = KafkaTopics.CASH_GATEWAY_EVENTS
)
