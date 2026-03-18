package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshotItem
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderSnapshotItemJpaRepository : JpaRepository<OrderSnapshotItem, Long> {

    fun findBySnapshotId(snapshotId: Long): List<OrderSnapshotItem>

    fun deleteBySnapshotId(snapshotId: Long)
}
