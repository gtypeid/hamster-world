package com.hamsterworld.progression.domain.quota.event

data class InternalQuotaResetEvent(
    val aggregateId: String,
    val userPublicId: String,
    val quotaKey: String,
    val cycleType: String
)
