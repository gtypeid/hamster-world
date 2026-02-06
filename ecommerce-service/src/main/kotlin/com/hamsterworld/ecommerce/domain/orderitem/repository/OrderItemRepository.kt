package com.hamsterworld.ecommerce.domain.orderitem.repository

import com.hamsterworld.ecommerce.domain.orderitem.model.OrderItem
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class OrderItemRepository(
    private val orderItemJpaRepository: OrderItemJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(orderItem: OrderItem): OrderItem {
        return orderItemJpaRepository.save(orderItem)
    }

    fun update(orderItem: OrderItem): OrderItem {
        orderItem.modifiedAt = LocalDateTime.now()
        return orderItemJpaRepository.save(orderItem)
    }

    fun findById(id: Long): OrderItem {
        return orderItemJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("주문 아이템을 찾을 수 없습니다. ID: $id") }
    }

    fun findByOrderId(orderId: Long): List<OrderItem> {
        return orderItemJpaRepository.findByOrderId(orderId)
    }
}
