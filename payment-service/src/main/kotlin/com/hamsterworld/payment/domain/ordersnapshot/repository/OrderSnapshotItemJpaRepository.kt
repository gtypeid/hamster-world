package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshotItem
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderSnapshotItemJpaRepository : JpaRepository<OrderSnapshotItem, Long> {

    /**
     * snapshotId로 OrderSnapshotItem 리스트 조회
     *
     * @param snapshotId OrderSnapshot ID
     * @return OrderSnapshotItem 리스트
     */
    fun findBySnapshotId(snapshotId: Long): List<OrderSnapshotItem>

    /**
     * snapshotId로 OrderSnapshotItem 전체 삭제
     *
     * @param snapshotId OrderSnapshot ID
     */
    fun deleteBySnapshotId(snapshotId: Long)
}
