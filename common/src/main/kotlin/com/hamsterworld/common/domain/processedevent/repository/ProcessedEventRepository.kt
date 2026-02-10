package com.hamsterworld.common.domain.processedevent.repository

import com.hamsterworld.common.domain.processedevent.model.ProcessedEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

/**
 * ProcessedEvent Repository
 *
 * Kafka 이벤트 처리 이력 관리
 *
 * ## 멱등성 체크
 * ```kotlin
 * if (processedEventRepository.existsByOriginEventId(originEventId)) {
 *     return  // 이미 처리된 이벤트
 * }
 * ```
 *
 * ## DB 레벨 중복 방지
 * - origin_event_id UNIQUE 제약으로 Race Condition 방지
 * - 동시에 2개 Consumer가 INSERT 시도해도 1개만 성공
 */
@Repository
interface ProcessedEventRepository : JpaRepository<ProcessedEvent, Long> {

    /**
     * 발행자의 eventId로 이미 처리된 이벤트인지 확인
     *
     * @param originEventId 발행자의 이벤트 ID (UUID)
     * @return 처리 이력 존재 여부
     */
    fun existsByOriginEventId(originEventId: String): Boolean

    /**
     * 발행자의 eventId로 처리 이력 조회
     *
     * @param originEventId 발행자의 이벤트 ID (UUID)
     * @return 처리 이력 (없으면 null)
     */
    fun findByOriginEventId(originEventId: String): ProcessedEvent?
}
