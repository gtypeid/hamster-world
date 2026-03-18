package com.hamsterworld.progression.domain.archive.event

data class InternalArchiveProgressUpdatedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val archiveId: String,
    val progress: Int,
    val requirement: Int,
    val isCompleted: Boolean
)
