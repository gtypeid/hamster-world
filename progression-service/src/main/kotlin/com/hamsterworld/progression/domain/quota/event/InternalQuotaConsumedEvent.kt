package com.hamsterworld.progression.domain.quota.event

data class InternalQuotaConsumedEvent(
    val aggregateId: String,
    val userPublicId: String,
    val quotaKey: String,
    val amount: Int,
    val consumed: Int,
    val maxLimit: Int,
    val isCompleted: Boolean
)
