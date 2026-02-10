package com.hamsterworld.common.domain.processedevent.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.LocalDateTime

/**
 * ProcessedEvent (Rich Domain Entity)
 *
 * Kafka 이벤트 멱등성 보장을 위한 도메인 엔티티
 *
 * ## 용도
 * - Consumer가 동일한 eventId를 2번 이상 처리하지 않도록 방지
 * - At-Least-Once Delivery 환경에서 멱등성 보장
 * - **모든 이벤트에 대해 1차 멱등성 체크 수행** (BaseKafkaConsumer에서 자동)
 * - **이벤트 추적성 보장**: 발행자의 aggregateId, aggregateType, traceId를 저장하여
 *   어떤 서비스의 어떤 Aggregate에서 발행된 이벤트인지 DB 레벨에서 추적 가능
 *
 * ## OutboxEvent ↔ ProcessedEvent 대응 (2026-02-10, Claude Opus 4 / claude-opus-4-6)
 *
 * "origin" prefix: 소비자 입장에서 이 필드들이 발행자(origin)의 것임을 명시
 *
 * ```
 * OutboxEvent (발행자)         Kafka Message              ProcessedEvent (소비자)
 * ─────────────────────       ─────────────────          ──────────────────────
 * eventId                  →  metadata.eventId        →  originEventId (UNIQUE, 멱등성 키 = 발행자의 eventId)
 * eventType                →  eventType               →  eventType
 * aggregateId              →  aggregateId             →  originAggregateId (발행자의 Aggregate ID)
 * aggregateType            →  aggregateType           →  originAggregateType (발행자의 Aggregate 타입)
 * traceId                  →  traceId + metadata      →  traceId (분산 추적, 서비스 간 공유)
 * ```
 *
 * 소비자 자신의 Aggregate 정보는 ProcessedEvent에 저장되지 않습니다.
 * 소비자가 새 이벤트를 발행하면, 그 정보는 자신의 OutboxEvent에 기록됩니다.
 *
 * ## 멱등성 보장 메커니즘 (2단계 방어)
 *
 * ### 1차 방어선: ProcessedEvent (모든 이벤트 공통)
 * - BaseKafkaConsumer에서 eventId로 먼저 체크
 * - 이미 처리된 이벤트면 비즈니스 로직 실행 안함 (early return)
 * - **자연 키 유무와 관계없이 모든 이벤트에 적용됨**
 *
 * ### 2차 방어선: 자연 키 UNIQUE 제약 (선택적)
 * - ProductCreatedEvent: SKU UNIQUE 제약 (추가 안전장치)
 * - OrderCreatedEvent: orderNumber UNIQUE 제약 (추가 안전장치)
 * - StockAdjustmentRequestedEvent: 자연 키 없음 → ProcessedEvent만 의존
 *
 * ## 왜 자연 키가 있어도 ProcessedEvent를 사용하는가?
 * 1. **성능**: DB INSERT 시도 전에 메모리/캐시로 빠르게 중복 체크 가능
 * 2. **일관성**: 모든 이벤트에 대해 동일한 멱등성 체크 로직 적용
 * 3. **안전성**: 자연 키 UNIQUE 제약은 2차 방어선으로 작동 (만약 ProcessedEvent 체크 실패 시)
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE processed_events (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,   -- Snowflake Base62 ID
 *     origin_event_id VARCHAR(255) NOT NULL UNIQUE, -- 발행자의 eventId (UUID, 멱등성 키)
 *     event_type VARCHAR(255) NOT NULL,         -- 이벤트 타입
 *     origin_aggregate_id VARCHAR(255),         -- 발행자의 Aggregate ID (Snowflake Base62)
 *     origin_aggregate_type VARCHAR(100),       -- 발행자의 Aggregate 타입 (Order, Product 등)
 *     trace_id VARCHAR(64),                     -- 분산 추적 Trace ID (OpenTelemetry)
 *     consumed_by VARCHAR(255) NOT NULL,        -- Consumer 이름
 *     processed_at TIMESTAMP NOT NULL,          -- 처리 시각
 *     created_at TIMESTAMP NOT NULL,            -- AbsDomain
 *     modified_at TIMESTAMP                     -- AbsDomain
 * );
 * CREATE UNIQUE INDEX idx_processed_events_origin_event_id ON processed_events(origin_event_id);
 * CREATE UNIQUE INDEX idx_processed_events_public_id ON processed_events(public_id);
 * CREATE INDEX idx_processed_events_trace_id ON processed_events(trace_id);
 * CREATE INDEX idx_processed_events_origin_aggregate_id ON processed_events(origin_aggregate_id);
 * ```
 *
 * ## UNIQUE 제약
 * - event_id에 UNIQUE 제약을 두어 동일 이벤트 중복 저장 방지
 * - DB 레벨에서 Race Condition 방지
 */
@Entity
@Table(
    name = "processed_events",
    indexes = [
        Index(name = "idx_processed_events_origin_event_id", columnList = "origin_event_id", unique = true),
        Index(name = "idx_processed_events_trace_id", columnList = "trace_id"),
        Index(name = "idx_processed_events_origin_aggregate_id", columnList = "origin_aggregate_id")
    ]
)
class ProcessedEvent(
    /**
     * 발행자(origin)의 이벤트 ID (UUID)
     *
     * 이 값은 발행자가 OutboxEvent에 기록한 eventId와 동일합니다.
     * 멱등성 보장의 핵심 키이며, UNIQUE 제약이 걸려 있습니다.
     *
     * OutboxEvent.eventId == Kafka metadata.eventId == ProcessedEvent.originEventId
     */
    @Column(name = "origin_event_id", nullable = false, unique = true, length = 255)
    var originEventId: String = "",

    @Column(name = "event_type", nullable = false, length = 255)
    var eventType: String = "",

    /**
     * 발행자(origin)의 Aggregate ID (Snowflake Base62)
     *
     * 이벤트를 발행한 서비스의 Aggregate Public ID입니다.
     * 예: ecommerce의 OrderCreatedEvent → Order.publicId
     *
     * "origin" prefix: 소비자(나) 자신의 Aggregate ID가 아닌,
     * 이벤트를 발행한 원천 서비스의 Aggregate ID임을 명시합니다.
     */
    @Column(name = "origin_aggregate_id", length = 255)
    var originAggregateId: String? = null,

    /**
     * 발행자(origin)의 Aggregate 타입
     *
     * 예: "Order", "Product", "PaymentProcess"
     *
     * originAggregateId와 함께 사용하여 "어떤 도메인의 어떤 엔티티에서 발행된 이벤트인지" 식별합니다.
     */
    @Column(name = "origin_aggregate_type", length = 100)
    var originAggregateType: String? = null,

    /**
     * 분산 추적 Trace ID (OpenTelemetry)
     *
     * 여러 서비스를 거치는 이벤트 체인을 DB 레벨에서 추적하기 위한 ID입니다.
     * OutboxEvent.traceId → Kafka metadata.traceId → ProcessedEvent.traceId
     */
    @Column(name = "trace_id", length = 64)
    var traceId: String? = null,

    @Column(name = "consumed_by", nullable = false, length = 255)
    var consumedBy: String = "",

    @Column(name = "processed_at", nullable = false)
    var processedAt: LocalDateTime = LocalDateTime.now()
) : AbsDomain()
