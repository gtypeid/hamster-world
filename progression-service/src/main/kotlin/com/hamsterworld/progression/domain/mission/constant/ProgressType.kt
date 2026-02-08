package com.hamsterworld.progression.domain.mission.constant

/**
 * Progress Type (업적 진행 방식)
 *
 * ## STAT_BASED (통계 기반)
 * - UserStatistics 테이블을 참조하여 조회 시 계산
 * - 이벤트마다 레코드 생성하지 않음
 * - 예: 총 구매액 100만원 달성 (UserStatistics.totalPurchaseAmount)
 *
 * ## EVENT_BASED (이벤트 기반)
 * - 이벤트 발생 시마다 UserArchiveProgress 레코드 생성/업데이트
 * - currentProgress 필드에 진행도 저장
 * - 예: 주문 10회 생성 (OrderCreatedEvent 10번 소비)
 */
enum class ProgressType {
    /**
     * 통계 참조 (조회 시 계산)
     * - UserStatistics 테이블 참조
     * - DB에 별도 진행도 저장 안 함
     */
    STAT_BASED,

    /**
     * 이벤트 매칭 (레코드 생성/업데이트)
     * - MissionCondition.matchesEvent() 사용
     * - currentProgress 증가
     */
    EVENT_BASED
}
