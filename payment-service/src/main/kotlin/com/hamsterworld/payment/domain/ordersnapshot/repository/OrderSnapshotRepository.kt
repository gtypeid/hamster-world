package com.hamsterworld.payment.domain.ordersnapshot.repository

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.payment.consumer.OrderItemDto
import com.hamsterworld.payment.domain.ordersnapshot.dto.OrderSnapshotWithItems
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshot
import com.hamsterworld.payment.domain.ordersnapshot.model.OrderSnapshotItem
import com.hamsterworld.payment.domain.product.repository.ProductRepository
import org.springframework.stereotype.Repository

/**
 * OrderSnapshot Repository (Domain Repository)
 *
 * **목적**: 결제 취소 시 재고 복원을 위해 주문 항목 정보를 DB에 저장
 *
 * **저장 방식**:
 * - product_order_snapshots (부모)
 * - product_order_snapshot_items (자식, FK 관계 없음)
 *
 * **생명 주기**:
 * - 재고 검증/차감 성공 후 ProductService에서 저장
 * - PaymentCancelledEvent 처리 시 조회하여 재고 복원
 */
@Repository
class OrderSnapshotRepository(
    private val orderSnapshotJpaRepository: OrderSnapshotJpaRepository,
    private val orderSnapshotItemJpaRepository: OrderSnapshotItemJpaRepository,
    private val productRepository: ProductRepository
) {

    /**
     * OrderSnapshot + OrderSnapshotItems 저장
     *
     * @param snapshot OrderSnapshot
     * @param items 주문 항목 리스트
     * @return 저장된 OrderSnapshot
     */
    fun save(snapshot: OrderSnapshot, items: List<OrderItemDto>): OrderSnapshot {
        // 1. OrderSnapshot 저장 (PK 할당)
        val savedSnapshot = orderSnapshotJpaRepository.save(snapshot)

        // 2. OrderSnapshotItems 저장
        val itemEntities = items.map { item ->
            // Public ID → Internal PK 변환
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

    /**
     * OrderSnapshot만 조회 (items 없음)
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @return OrderSnapshot (없으면 null)
     */
    fun findByOrderPublicId(orderPublicId: String): OrderSnapshot? {
        return orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId)
    }

    /**
     * OrderSnapshot + Items 조회
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @return OrderSnapshotWithItems (없으면 null)
     */
    fun findByOrderPublicIdWithItems(orderPublicId: String): OrderSnapshotWithItems? {
        // 1. OrderSnapshot 조회
        val snapshot = orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId) ?: return null

        // 2. OrderSnapshotItems 조회
        val itemEntities = orderSnapshotItemJpaRepository.findBySnapshotId(snapshot.id!!)

        // 3. OrderItemDto로 변환 (Internal PK → Public ID)
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

    /**
     * OrderSnapshot + Items 조회 (Not Null)
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     * @return OrderSnapshotWithItems
     * @throws CustomRuntimeException OrderSnapshot을 찾을 수 없을 때
     */
    fun findByOrderPublicIdWithItemsOrThrow(orderPublicId: String): OrderSnapshotWithItems {
        return findByOrderPublicIdWithItems(orderPublicId)
            ?: throw CustomRuntimeException("OrderSnapshot을 찾을 수 없습니다. orderPublicId: $orderPublicId")
    }

    /**
     * OrderSnapshot + Items 조회 (by orderSnapshotId)
     *
     * ## 사용처
     * - PaymentEventHandler.handleInternalStockRestore()
     * - Payment 내부에서 orderSnapshotId로 조회 (Internal PK)
     *
     * @param orderSnapshotId OrderSnapshot Internal PK
     * @return OrderSnapshotWithItems (없으면 null)
     */
    fun findByOrderSnapshotIdWithItems(orderSnapshotId: Long): OrderSnapshotWithItems? {
        // 1. OrderSnapshot 조회
        val snapshot = orderSnapshotJpaRepository.findById(orderSnapshotId).orElse(null) ?: return null

        // 2. OrderSnapshotItems 조회
        val itemEntities = orderSnapshotItemJpaRepository.findBySnapshotId(snapshot.id!!)

        // 3. OrderItemDto로 변환 (Internal PK → Public ID)
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

    /**
     * OrderSnapshot + OrderSnapshotItems 삭제 (선택적)
     *
     * @param orderPublicId E-commerce Service의 Order Public ID (Snowflake Base62)
     */
    fun delete(orderPublicId: String) {
        val snapshot = orderSnapshotJpaRepository.findByOrderPublicId(orderPublicId) ?: return

        // 1. OrderSnapshotItems 삭제
        orderSnapshotItemJpaRepository.deleteBySnapshotId(snapshot.id!!)

        // 2. OrderSnapshot 삭제
        orderSnapshotJpaRepository.delete(snapshot)
    }
}
