package com.hamsterworld.progression.domain.archive.model

import com.hamsterworld.progression.domain.archive.constant.ArchiveType
import com.hamsterworld.progression.domain.constant.RewardType
import com.hamsterworld.progression.domain.constant.MissionConditionEmitter
import com.hamsterworld.progression.domain.mission.model.MissionCondition
import com.hamsterworld.progression.domain.mission.constant.ProgressType

data class ArchiveMaster(
    val archiveId: String,
    val archiveCode: String,
    val name: String,
    val description: String,
    val archiveType: ArchiveType,
    val progressType: ProgressType,
    val sortOrder: Int = 0,
    val condition: MissionCondition? = null,
    val statKey: String? = null,
    val emitter: MissionConditionEmitter
) {
    val rewardType: RewardType get() = emitter.rewardType
    val rewardAmount: Int get() = emitter.rewardAmount

    fun isStatBased(): Boolean = progressType == ProgressType.STAT_BASED

    fun isEventBased(): Boolean = progressType == ProgressType.EVENT_BASED

    fun getRequirement(): Int {
        return condition?.requirement ?: 1
    }

    fun matchesEvent(eventType: String, eventFilters: Map<String, String> = emptyMap()): Boolean {
        if (!isEventBased()) return false
        return condition?.matchesEvent(eventType, eventFilters) ?: false
    }
}
