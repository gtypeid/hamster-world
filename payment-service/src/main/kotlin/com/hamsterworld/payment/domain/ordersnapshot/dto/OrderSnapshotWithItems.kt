package com.hamsterworld.payment.domain.ordersnapshot.dto

import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot

data class OrderSnapshotWithItems(
    val snapshot: OrderSnapshot,
    val items: List<OrderItemDto>
) {
    val orderPublicId: String
        get() = snapshot.orderPublicId

    val orderNumber: String
        get() = snapshot.orderNumber
}
