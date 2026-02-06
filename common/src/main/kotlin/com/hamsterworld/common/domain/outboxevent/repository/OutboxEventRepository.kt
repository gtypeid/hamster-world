package com.hamsterworld.common.domain.outboxevent.repository

import com.hamsterworld.common.domain.outboxevent.model.OutboxEvent
import com.hamsterworld.common.domain.outboxevent.model.OutboxEventStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

/**
 * OutboxEvent Repository
 *
 * Transactional Outbox Pattern을 위한 이벤트 저장소
 *
 * ## 주요 기능
 * 1. PENDING 이벤트 조회 (OutboxEventProcessor가 사용)
 * 2. 발행 완료된 오래된 이벤트 정리
 * 3. 실패한 이벤트 조회 (모니터링/알람)
 */
@Repository
interface OutboxEventRepository : JpaRepository<OutboxEvent, Long> {

    /**
     * PENDING 상태의 이벤트 조회 (발행 대기 중)
     *
     * OutboxEventProcessor가 주기적으로 호출하여 Kafka로 발행
     *
     * @param status 상태 (PENDING)
     * @return 발행 대기 중인 이벤트 리스트 (created_at 오름차순)
     */
    fun findByStatusOrderByCreatedAtAsc(status: OutboxEventStatus): List<OutboxEvent>

    /**
     * 특정 시각 이전에 발행 완료된 이벤트 조회
     *
     * 주기적으로 오래된 PUBLISHED 이벤트 삭제 시 사용
     *
     * @param status 상태 (PUBLISHED)
     * @param publishedAt 발행 완료 시각
     * @return 삭제 대상 이벤트 리스트
     */
    fun findByStatusAndPublishedAtBefore(
        status: OutboxEventStatus,
        publishedAt: LocalDateTime
    ): List<OutboxEvent>

    /**
     * FAILED 상태의 이벤트 조회 (모니터링/알람)
     *
     * 발행 실패한 이벤트를 조회하여 수동 처리 또는 알람 발송
     *
     * @param status 상태 (FAILED)
     * @return 발행 실패한 이벤트 리스트
     */
    fun findByStatusOrderByCreatedAtDesc(status: OutboxEventStatus): List<OutboxEvent>

    /**
     * eventId로 이벤트 존재 여부 확인
     *
     * ⚠️ 주의: OutboxEventRecorder에서는 사용하지 않음
     * - 멱등성은 DB UNIQUE 제약조건으로 보장
     * - 디버깅/모니터링 용도로만 사용
     *
     * @param eventId 이벤트 ID (UUID)
     * @return 존재 여부
     */
    fun existsByEventId(eventId: String): Boolean

    /**
     * eventId로 이벤트 조회
     *
     * 디버깅/모니터링 용도
     *
     * @param eventId 이벤트 ID (UUID)
     * @return OutboxEvent 또는 null
     */
    fun findByEventId(eventId: String): OutboxEvent?
}
