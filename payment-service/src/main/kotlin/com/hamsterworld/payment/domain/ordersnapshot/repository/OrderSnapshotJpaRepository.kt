package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OrderSnapshotJpaRepository : JpaRepository<OrderSnapshot, Long> {

    /**
     * orderPublicId로 OrderSnapshot 조회
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @return OrderSnapshot (없으면 null)
     */
    fun findByOrderPublicId(orderPublicId: String): OrderSnapshot?
}
