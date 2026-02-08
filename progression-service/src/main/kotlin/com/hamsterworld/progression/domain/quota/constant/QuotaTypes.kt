package com.hamsterworld.progression.domain.quota.constant

/**
 * Cycle Type (리셋 주기)
 */
enum class CycleType {
    DAILY,      // 매일 리셋
    WEEKLY,     // 주간 리셋 (월요일 기준)
    MONTHLY,    // 월간 리셋
    NEVER       // 리셋 안 함 (Archive와 동일)
}

/**
 * Quota Type (할당량 타입)
 */
enum class QuotaType {
    /**
     * 행동 집계 + 보상
     * - consumed가 maxLimit 도달 시 보상 클레임 가능
     * - 예: 일일 주문 5회 → 보상
     */
    ACTION_REWARD,

    /**
     * 행동 제약만 (보상 없음)
     * - consumed가 maxLimit 도달 시 더 이상 행동 불가
     * - 예: 주간 쿠폰 사용 3회까지만
     */
    ACTION_CONSTRAINT
}
