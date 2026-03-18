package com.hamsterworld.progression.domain.mission.model

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.hamsterworld.progression.domain.mission.constant.MissionType
import com.hamsterworld.progression.domain.mission.constant.toEventType
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated

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

    fun updateProgress(amount: Int): Boolean {
        currentProgress = minOf(currentProgress + amount, requirement)
        return isCompleted()
    }

    fun setProgress(progress: Int): Boolean {
        currentProgress = minOf(progress, requirement)
        return isCompleted()
    }

    fun isCompleted(): Boolean = currentProgress >= requirement

    fun getRemaining(): Int = maxOf(0, requirement - currentProgress)

    fun getProgressRate(): Double =
        if (requirement == 0) 1.0
        else currentProgress.toDouble() / requirement

    fun reset() {
        currentProgress = 0
    }

    fun getFilters(): Map<String, String> {
        if (filtersJson.isNullOrBlank()) return emptyMap()
        return try {
            objectMapper.readValue(filtersJson, object : TypeReference<Map<String, String>>() {})
        } catch (e: Exception) {
            emptyMap()
        }
    }

    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        val expectedEventType = type.toEventType()
        if (eventType != expectedEventType) return false

        val conditionFilters = getFilters()
        if (conditionFilters.isEmpty()) {
            return true
        }

        return conditionFilters.all { (key, value) ->
            eventFilters[key] == value
        }
    }

    fun matchesAmount(amount: Long): Boolean {
        val filters = getFilters()
        val minAmount = filters["minAmount"]?.toLongOrNull() ?: return true
        return amount >= minAmount
    }
}
