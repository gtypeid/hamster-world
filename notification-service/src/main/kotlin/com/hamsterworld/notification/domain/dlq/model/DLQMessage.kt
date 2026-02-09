package com.hamsterworld.notification.domain.dlq.model

import com.hamsterworld.notification.domain.dlq.constant.DLQStatus
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.LocalDateTime

/**
 * Dead Letter Queue Message Document
 *
 * Kafka DLT로 전송된 메시지를 MongoDB에 저장하여 추적 및 재처리
 *
 * ## DLT 토픽 구조
 * - `ecommerce-events-dlt`: E-commerce Service에서 실패한 메시지
 * - `payment-events-dlt`: Payment Service에서 실패한 메시지
 * - `cash-gateway-events-dlt`: Cash Gateway Service에서 실패한 메시지
 * - `progression-events-dlt`: Progression Service에서 실패한 메시지
 *
 * ## 메시지 헤더 (KafkaErrorHandlerConfig에서 추가)
 * - `x-failed-service`: 실패한 서비스명
 * - `x-failed-consumer-group`: Consumer Group ID
 * - `x-failed-at`: 실패 시각
 * - `x-failed-reason`: 실패 사유
 * - Spring Kafka DLT 기본 헤더들도 포함
 */
@Document(collection = "dlq_messages")
data class DLQMessage(
    @Id
    val id: String? = null,

    /**
     * 원본 토픽 이름
     * 예: "ecommerce-events"
     */
    @Indexed
    val originalTopic: String,

    /**
     * Consumer Group ID (어느 서비스에서 실패했는지)
     * 예: "ecommerce-service", "payment-service"
     */
    @Indexed
    val consumerGroup: String,

    /**
     * 원본 파티션 번호
     */
    val originalPartition: Int,

    /**
     * 원본 오프셋
     */
    val originalOffset: Long,

    /**
     * 원본 메시지 타임스탬프
     */
    val originalTimestamp: Long,

    /**
     * 원본 메시지 내용 (JSON String)
     */
    val originalMessage: String,

    // ===== BaseDomainEvent 공통 필드 (외벽으로 추출) =====

    /**
     * Aggregate ID (도메인 식별자)
     * BaseDomainEvent.aggregateId
     */
    @Indexed
    val aggregateId: String?,

    /**
     * Event ID (이벤트 고유 ID)
     * BaseDomainEvent.eventId
     */
    @Indexed
    val eventId: String?,

    /**
     * Trace ID (분산 추적 ID)
     * BaseDomainEvent.traceId
     */
    @Indexed
    val traceId: String?,

    /**
     * Event Type (이벤트 타입명)
     * 예: "ProductCreatedEvent", "OrderPlacedEvent"
     */
    @Indexed
    val eventType: String?,

    /**
     * Event Occurred At (이벤트 발생 시각)
     * BaseDomainEvent.occurredAt
     */
    @Indexed
    val eventOccurredAt: LocalDateTime?,

    // ===== 예외 정보 =====

    /**
     * 발생한 예외 클래스명
     * 예: "org.springframework.dao.DataIntegrityViolationException"
     */
    @Indexed
    val exceptionClass: String,

    /**
     * 예외 메시지
     */
    val exceptionMessage: String?,

    /**
     * 스택 트레이스 (전체)
     */
    val stackTrace: String?,

    /**
     * DLT로 전송된 시간
     */
    @Indexed
    val failedAt: LocalDateTime = LocalDateTime.now(),

    /**
     * 재시도 횟수 (DLT 이동 전 시도 횟수)
     */
    val retryCount: Int = 0,

    /**
     * 처리 상태
     */
    @Indexed
    var status: DLQStatus = DLQStatus.PENDING,

    /**
     * 원본 메시지의 Kafka 헤더들
     * traceId, correlationId 등 추적용 헤더 포함
     */
    val headers: Map<String, String> = emptyMap(),

    /**
     * 해결된 시간
     */
    var resolvedAt: LocalDateTime? = null,

    /**
     * 해결한 관리자 ID
     */
    var resolvedBy: String? = null,

    /**
     * 관리자 메모
     */
    var notes: String? = null,

    /**
     * 재처리 시도 횟수 (DLQ에서 재처리 시도)
     */
    var reprocessAttempts: Int = 0,

    /**
     * 마지막 재처리 시도 시간
     */
    var lastReprocessAt: LocalDateTime? = null
) {
    /**
     * 메시지를 재처리 상태로 변경
     */
    fun markAsReprocessing() {
        this.status = DLQStatus.REPROCESSING
        this.reprocessAttempts++
        this.lastReprocessAt = LocalDateTime.now()
    }

    /**
     * 메시지를 해결됨으로 표시
     */
    fun markAsResolved(adminId: String, note: String? = null) {
        this.status = DLQStatus.RESOLVED
        this.resolvedAt = LocalDateTime.now()
        this.resolvedBy = adminId
        if (note != null) {
            this.notes = note
        }
    }

    /**
     * 메시지를 무시됨으로 표시
     */
    fun markAsIgnored(adminId: String, reason: String) {
        this.status = DLQStatus.IGNORED
        this.resolvedAt = LocalDateTime.now()
        this.resolvedBy = adminId
        this.notes = "IGNORED: $reason"
    }

    /**
     * DLT 토픽명 생성
     * "ecommerce-events" → "ecommerce-events-dlt"
     */
    fun getDLTTopicName(): String {
        return "$originalTopic-dlt"
    }
}
