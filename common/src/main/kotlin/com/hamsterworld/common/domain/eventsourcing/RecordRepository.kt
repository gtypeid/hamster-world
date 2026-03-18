package com.hamsterworld.common.domain.eventsourcing
interface RecordRepository<T> {
    fun readRecord(id: Long): T
    fun writeRecord(id: Long): T
}
