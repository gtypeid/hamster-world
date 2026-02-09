package com.hamsterworld.notification.domain.dlq.constant

/**
 * DLQ 메시지 처리 상태
 */
enum class DLQStatus {
    /**
     * 미처리 - 관리자 확인 필요
     */
    PENDING,

    /**
     * 재처리 중
     */
    REPROCESSING,

    /**
     * 해결됨 - 재처리 성공 또는 수동 해결
     */
    RESOLVED,

    /**
     * 무시됨 - 처리 불필요하다고 판단
     */
    IGNORED
}
