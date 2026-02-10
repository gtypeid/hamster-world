package com.hamsterworld.common.domain.outboxevent.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
import java.time.LocalDateTime

/**
 * OutboxEvent (Rich Domain Entity)
 *
 * Transactional Outbox Pattern을 위한 도메인 엔티티
 *
 * ## 용도
 * - DB 트랜잭션과 함께 이벤트를 저장하여 데이터 일관성 보장
 * - Kafka 발행 실패 시에도 DB는 커밋되어 진실의 원천(Source of Truth) 유지
 * - 별도의 OutboxEventProcessor가 주기적으로 PENDING 이벤트를 조회하여 Kafka로 발행
 *
 * ## Outbox Pattern 플로우
 * ```
 * [트랜잭션 내부 - 원자적 보장]
 * 1. 비즈니스 로직 수행 (예: Order 생성)
 * 2. Order FLUSH (INSERT 쿼리 전송, 아직 커밋 전)
 * 3. OutboxEventRecorder.recordDomainEvent() 실행 (BEFORE_COMMIT)
 * 4. OutboxEvent FLUSH (INSERT 쿼리 전송, 아직 커밋 전)
 * 5. DB COMMIT ✅ (Order + OutboxEvent 원자적 저장)
 *
 * [별도 프로세스 - 비동기]
 * 6. OutboxEventProcessor가 주기적으로 PENDING 이벤트 조회
 * 7. Kafka로 발행 시도
 * 8. 성공 시 status → PUBLISHED, publishedAt 기록
 * 9. 실패 시 retryCount 증가, 최대 재시도 초과 시 status → FAILED
 * ```
 *
 * ## 멱등성 보장
 * - **DB UNIQUE 제약조건**: event_id 컬럼에 UNIQUE 제약
 * - 중복 INSERT 시도 시 DB에서 예외 발생 → 전체 트랜잭션 롤백
 * - OutboxEventRecorder에서 별도 중복 체크 안 함 (DB에 위임)
 * - Order와 OutboxEvent의 원자성 보장 (둘 다 저장되거나, 둘 다 롤백)
 *
 * ## ProcessedEvent와의 차이
 * - **OutboxEvent**: Producer가 발행할 이벤트를 DB에 먼저 저장 (발행 보장)
 * - **ProcessedEvent**: Consumer가 수신한 이벤트의 처리 이력 저장 (중복 방지)
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE outbox_events (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,     -- Snowflake Base62 ID
 *     event_id VARCHAR(255) NOT NULL UNIQUE,      -- Kafka Event ID (UUID)
 *     event_type VARCHAR(255) NOT NULL,           -- 이벤트 타입
 *     aggregate_id VARCHAR(255) NOT NULL,         -- Aggregate ID (파티션 키)
 *     aggregate_type VARCHAR(100) NOT NULL,       -- Aggregate 타입 (Order, Product 등)
 *     topic VARCHAR(255) NOT NULL,                -- Kafka 토픽
 *     payload MEDIUMTEXT NOT NULL,                -- JSON payload
 *     status VARCHAR(50) NOT NULL,                -- PENDING/PUBLISHED/FAILED
 *     retry_count INT NOT NULL DEFAULT 0,         -- 재시도 횟수
 *     published_at TIMESTAMP NULL,                -- 발행 완료 시각
 *     error_message TEXT NULL,                    -- 에러 메시지
 *     created_at TIMESTAMP NOT NULL,              -- AbsDomain
 *     modified_at TIMESTAMP                       -- AbsDomain
 * );
 * CREATE UNIQUE INDEX idx_outbox_events_event_id ON outbox_events(event_id);
 * CREATE UNIQUE INDEX idx_outbox_events_public_id ON outbox_events(public_id);
 * CREATE INDEX idx_outbox_events_status ON outbox_events(status);
 * CREATE INDEX idx_outbox_events_created_at ON outbox_events(created_at);
 * ```
 *
 * ## 인덱스 전략
 * - event_id: UNIQUE 인덱스 (중복 방지 + 멱등성 보장)
 * - public_id: UNIQUE 인덱스 (AbsDomain)
 * - status: 인덱스 (PENDING 이벤트 조회 최적화)
 * - created_at: 인덱스 (오래된 PENDING 이벤트 우선 처리)
 *
 * ## 트랜잭션 보장
 * - BEFORE_COMMIT: OutboxEvent 저장 실패 시 비즈니스 로직도 롤백
 * - Order가 DB에 있으면 OutboxEvent도 반드시 있음 (원자성)
 * - 이벤트 소실 불가능 ✅
 */
@Entity
@Table(
    name = "outbox_events",
    indexes = [
        Index(name = "idx_outbox_events_event_id", columnList = "event_id", unique = true),
        Index(name = "idx_outbox_events_status", columnList = "status"),
        Index(name = "idx_outbox_events_created_at", columnList = "created_at")
    ]
)
class OutboxEvent(
    @Column(name = "event_id", nullable = false, unique = true, length = 255)
    var eventId: String = "",

    @Column(name = "event_type", nullable = false, length = 255)
    var eventType: String = "",

    @Column(name = "aggregate_id", nullable = false, length = 255)
    var aggregateId: String = "",

    @Column(name = "aggregate_type", nullable = false, length = 100)
    var aggregateType: String = "",

    @Column(name = "topic", nullable = false, length = 255)
    var topic: String = "",

    @Column(name = "payload", nullable = false, columnDefinition = "MEDIUMTEXT")
    var payload: String = "",

    @Column(name = "trace_id", length = 32)
    var traceId: String? = null,

    @Column(name = "span_id", length = 16)
    var spanId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: OutboxEventStatus = OutboxEventStatus.PENDING,

    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0,

    @Column(name = "published_at")
    var publishedAt: LocalDateTime? = null,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null
) : AbsDomain() {

    /**
     * Kafka 발행 성공 처리
     */
    fun markAsPublished() {
        this.status = OutboxEventStatus.PUBLISHED
        this.publishedAt = LocalDateTime.now()
        this.errorMessage = null
    }

    /**
     * Kafka 발행 실패 처리 (재시도 가능)
     */
    fun markAsFailedWithRetry(error: String, maxRetryCount: Int = 3) {
        this.retryCount++
        this.errorMessage = error

        if (this.retryCount >= maxRetryCount) {
            this.status = OutboxEventStatus.FAILED
        }
    }

    /**
     * 발행 가능 여부 체크
     */
    fun canPublish(): Boolean {
        return status == OutboxEventStatus.PENDING
    }
}
