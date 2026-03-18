package com.hamsterworld.payment.domain.payment.event

data class InternalStockRestoreEvent(
    val orderPublicId: String,
    val orderSnapshotId: Long,
    val reason: String
)
