package com.hamsterworld.progression.domain.archive.event

data class InternalArchiveCompletedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val archiveId: String
)
