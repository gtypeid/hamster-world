package com.hamsterworld.common.domain.outboxevent.model

/**
 * OutboxEvent 발행 상태
 *
 * ## 상태 전이
 * ```
 * PENDING → PUBLISHED (성공)
 * PENDING → FAILED (최대 재시도 초과)
 * ```
 */
enum class OutboxEventStatus {
    /**
     * 발행 대기 중
     * - OutboxEvent가 처음 생성된 상태
     * - OutboxEventProcessor가 주기적으로 PENDING 상태의 이벤트를 조회하여 Kafka로 발행
     */
    PENDING,

    /**
     * 발행 완료
     * - Kafka로 성공적으로 발행됨
     * - publishedAt에 발행 완료 시각 기록
     * - 일정 시간 후 삭제 또는 보관 (정책에 따라)
     */
    PUBLISHED,

    /**
     * 발행 실패 (최대 재시도 초과)
     * - 최대 재시도 횟수를 초과하여 발행 실패
     * - errorMessage에 마지막 에러 메시지 기록
     * - 수동 처리 또는 알람 필요
     */
    FAILED
}
