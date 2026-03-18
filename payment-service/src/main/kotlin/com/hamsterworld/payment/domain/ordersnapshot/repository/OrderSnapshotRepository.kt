package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.ordersnapshot.dto.OrderSnapshotWithItems
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshotItem
import com.hamsterworld.payment.domain.product.repository.ProductRepository
import org.springframework.stereotype.Repository

@Repository
class OrderSnapshotRepository(
    private val orderSnapshotJpaRepository: OrderSnapshotJpaRepository,
    private val orderSnapshotItemJpaRepository: OrderSnapshotItemJpaRepository,
    private val productRepository: ProductRepository
) {

    fun save(snapshot: OrderSnapshot, items: List<OrderItemDto>): OrderSnapshot {
        val savedSnapshot = orderSnapshotJpaRepository.save(snapshot)

        val itemEntities = items.map { item ->
            val product = productRepository.findByEcommerceProductId(item.productPublicId)
            OrderSnapshotItem(
                snapshotId = savedSnapshot.id!!,
                productId = product.id!!,
                ecommerceProductPublicId = item.productPublicId,
                merchantPublicId = item.merchantPublicId,
                quantity = item.quantity,
                price = item.price
            )
        }
        orderSnapshotItemJpaRepository.saveAll(itemEntities)

        return savedSnapshot
    }

    fun findByOrderPublicId(orderPublicId: String): OrderSnapshot? {
        return orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId)
    }

    fun findByOrderPublicIdWithItems(orderPublicId: String): OrderSnapshotWithItems? {
        val snapshot = orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId) ?: return null

        val itemEntities = orderSnapshotItemJpaRepository.findBySnapshotId(snapshot.id!!)

        val items = itemEntities.map { item ->
            val product = productRepository.findById(item.productId)
            OrderItemDto(
                productPublicId = product.ecommerceProductId!!,
                merchantPublicId = item.merchantPublicId,
                quantity = item.quantity,
                price = item.price
            )
        }

        return OrderSnapshotWithItems(
            snapshot = snapshot,
            items = items
        )
    }

    fun findByOrderPublicIdWithItemsOrThrow(orderPublicId: String): OrderSnapshotWithItems {
        return findByOrderPublicIdWithItems(orderPublicId)
            ?: throw CustomRuntimeException("OrderSnapshot을 찾을 수 없습니다. orderPublicId: $orderPublicId")
    }

    fun findByOrderSnapshotIdWithItems(orderSnapshotId: Long): OrderSnapshotWithItems? {
        val snapshot = orderSnapshotJpaRepository.findById(orderSnapshotId).orElse(null) ?: return null

        val itemEntities = orderSnapshotItemJpaRepository.findBySnapshotId(snapshot.id!!)

        val items = itemEntities.map { item ->
            val product = productRepository.findById(item.productId)
            OrderItemDto(
                productPublicId = product.ecommerceProductId!!,
                merchantPublicId = item.merchantPublicId,
                quantity = item.quantity,
                price = item.price
            )
        }

        return OrderSnapshotWithItems(
            snapshot = snapshot,
            items = items
        )
    }

    fun delete(orderPublicId: String) {
        val snapshot = orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId) ?: return

        orderSnapshotItemJpaRepository.deleteBySnapshotId(snapshot.id!!)

        orderSnapshotJpaRepository.delete(snapshot)
    }
}
