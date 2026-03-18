package com.hamsterworld.notification.domain.dlq.constant

enum class DLQStatus {
    PENDING,
    REPROCESSING,
    RESOLVED,
    IGNORED
}
