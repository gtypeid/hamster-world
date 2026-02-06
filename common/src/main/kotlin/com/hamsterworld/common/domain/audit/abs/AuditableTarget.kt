package com.hamsterworld.common.domain.audit.abs

interface AuditableTarget {
    /**
     * 엔티티 ID (Public ID 사용)
     * Audit 추적용으로 외부 노출 가능한 ID 반환
     */
    fun entityId(): String

    /**
     * 엔티티 타입
     * 클래스 이름 반환
     */
    fun entityType(): String
}
