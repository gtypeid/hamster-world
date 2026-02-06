package com.hamsterworld.payment.domain.ordersnapshot.dto

import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot

/**
 * OrderSnapshot + Items DTO
 *
 * **목적**: OrderSnapshot과 OrderSnapshotItems를 함께 조회한 결과
 *
 * **사용처**:
 * - 결제 취소 시 재고 복원 (items 필요)
 * - 주문 스냅샷 상세 조회 (items 필요)
 *
 * **생성 방법**: OrderSnapshotRepository.findByOrderIdWithItems()
 */
data class OrderSnapshotWithItems(
    val snapshot: OrderSnapshot,
    val items: List<OrderItemDto>
) {
    /**
     * 편의 메서드: snapshot의 orderPublicId 반환
     */
    val orderPublicId: String
        get() = snapshot.orderPublicId

    /**
     * 편의 메서드: snapshot의 orderNumber 반환
     */
    val orderNumber: String
        get() = snapshot.orderNumber
}
