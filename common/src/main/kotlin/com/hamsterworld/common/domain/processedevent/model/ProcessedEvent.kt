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
 *     event_id VARCHAR(255) NOT NULL UNIQUE,    -- Kafka Event ID (UUID)
 *     event_type VARCHAR(255) NOT NULL,         -- 이벤트 타입
 *     consumed_by VARCHAR(255) NOT NULL,        -- Consumer 이름
 *     processed_at TIMESTAMP NOT NULL,          -- 처리 시각
 *     created_at TIMESTAMP NOT NULL,            -- AbsDomain
 *     modified_at TIMESTAMP                     -- AbsDomain
 * );
 * CREATE UNIQUE INDEX idx_processed_events_event_id ON processed_events(event_id);
 * CREATE UNIQUE INDEX idx_processed_events_public_id ON processed_events(public_id);
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
        Index(name = "idx_processed_events_event_id", columnList = "event_id", unique = true)
    ]
)
class ProcessedEvent(
    @Column(name = "event_id", nullable = false, unique = true, length = 255)
    var eventId: String = "",

    @Column(name = "event_type", nullable = false, length = 255)
    var eventType: String = "",

    @Column(name = "consumed_by", nullable = false, length = 255)
    var consumedBy: String = "",

    @Column(name = "processed_at", nullable = false)
    var processedAt: LocalDateTime = LocalDateTime.now()
) : AbsDomain()
