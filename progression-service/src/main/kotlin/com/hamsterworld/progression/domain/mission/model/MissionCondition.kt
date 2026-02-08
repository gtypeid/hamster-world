package com.hamsterworld.progression.domain.mission.model

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.progression.domain.mission.constant.MissionType
import com.hamsterworld.progression.domain.mission.constant.toEventType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated

/**
 * Mission Condition (조건 체크를 위한 공통 모델)
 *
 * Potato World의 MissionCondition 패턴 적용
 * Archive와 Quota에서 공통으로 사용
 *
 * ## 특징
 * - Embeddable: Archive/Quota 엔티티에 포함
 * - 이벤트 기반 매칭: matchesEvent()
 * - 진행도 관리: updateProgress(), isCompleted()
 * - 유연한 필터링: JSON 기반 조건 ({"minAmount": "100000"})
 *
 * ## 사용 예시
 * ```kotlin
 * val condition = MissionCondition(
 *     type = MissionType.CREATE_ORDER,
 *     requirement = 10,
 *     filtersJson = """{"region": "성수동"}"""
 * )
 *
 * // 이벤트 매칭
 * if (condition.matchesEvent("OrderCreatedEvent", mapOf("region" to "성수동"))) {
 *     condition.updateProgress(1)  // 진행도 +1
 * }
 * ```
 */
@Embeddable
data class MissionCondition(
    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false)
    val type: MissionType,

    @Column(name = "condition_requirement", nullable = false)
    val requirement: Int = 1,

    @Column(name = "condition_current_progress", nullable = false)
    var currentProgress: Int = 0,

    @Column(name = "condition_filters_json", columnDefinition = "TEXT")
    val filtersJson: String? = null
) {
    private val objectMapper = jacksonObjectMapper()

    /**
     * 진행도 업데이트
     * @param amount 증가량
     * @return 완료 여부
     */
    fun updateProgress(amount: Int): Boolean {
        currentProgress = minOf(currentProgress + amount, requirement)
        return isCompleted()
    }

    /**
     * 진행도 설정 (덮어쓰기)
     */
    fun setProgress(progress: Int): Boolean {
        currentProgress = minOf(progress, requirement)
        return isCompleted()
    }

    /**
     * 완료 여부 체크
     */
    fun isCompleted(): Boolean = currentProgress >= requirement

    /**
     * 남은 진행도
     */
    fun getRemaining(): Int = maxOf(0, requirement - currentProgress)

    /**
     * 진행률 (0.0 ~ 1.0)
     */
    fun getProgressRate(): Double =
        if (requirement == 0) 1.0
        else currentProgress.toDouble() / requirement

    /**
     * 조건 리셋
     */
    fun reset() {
        currentProgress = 0
    }

    /**
     * 필터를 Map으로 파싱
     */
    fun getFilters(): Map<String, String> {
        if (filtersJson.isNullOrBlank()) return emptyMap()
        return try {
            objectMapper.readValue(filtersJson, object : TypeReference<Map<String, String>>() {})
        } catch (e: Exception) {
            emptyMap()
        }
    }

    /**
     * 이벤트와 조건 매칭 체크
     *
     * @param eventType 이벤트 타입 (예: "OrderCreatedEvent")
     * @param eventFilters 이벤트의 필터 맵 (예: {"region": "성수동", "timeSlot": "EVENING"})
     * @return 매칭 여부
     */
    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        // 1. 이벤트 타입 체크
        val expectedEventType = type.toEventType()
        if (eventType != expectedEventType) return false

        // 2. 필터 조건 체크 (조건의 모든 필터가 이벤트와 일치해야 함)
        val conditionFilters = getFilters()
        if (conditionFilters.isEmpty()) {
            // 필터가 없으면 타입만 일치하면 OK
            return true
        }

        // 조건의 모든 필터가 이벤트 필터와 매칭되어야 함
        return conditionFilters.all { (key, value) ->
            eventFilters[key] == value
        }
    }

    /**
     * 금액 조건 체크 (특수 케이스)
     *
     * @param amount 이벤트의 금액
     * @return 조건 충족 여부
     */
    fun matchesAmount(amount: Long): Boolean {
        val filters = getFilters()
        val minAmount = filters["minAmount"]?.toLongOrNull() ?: return true
        return amount >= minAmount
    }
}
