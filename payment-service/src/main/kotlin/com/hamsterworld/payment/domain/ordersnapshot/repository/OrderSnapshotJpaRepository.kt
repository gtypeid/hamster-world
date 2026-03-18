package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderSnapshotJpaRepository : JpaRepository<OrderSnapshot, Long> {

    fun findByOrderPublicId(orderPublicId: String): OrderSnapshot?
}
