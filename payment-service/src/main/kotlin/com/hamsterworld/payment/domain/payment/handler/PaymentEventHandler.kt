package com.hamsterworld.payment.domain.payment.handler

import com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
import com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent
import com.hamsterworld.payment.domain.product.service.ProductService
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

@Component
class PaymentEventHandler(
    private val orderSnapshotRepository: OrderSnapshotRepository,
    private val productService: ProductService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    fun handleInternalStockRestore(event: InternalStockRestoreEvent) {
        logger.info(
            "[재고 복원 시작] orderPublicId={} | orderSnapshotId={} | reason={}",
            event.orderPublicId, event.orderSnapshotId, event.reason
        )

        val snapshotWithItems = orderSnapshotRepository.findByOrderSnapshotIdWithItems(event.orderSnapshotId)
        if (snapshotWithItems == null) {
            logger.error(
                "[재고 복원 실패] OrderSnapshot 없음 | orderPublicId={} | orderSnapshotId={}",
                event.orderPublicId, event.orderSnapshotId
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderSnapshotId=${event.orderSnapshotId}")
        }

        productService.restoreStockForOrder(
            orderPublicId = event.orderPublicId,
            items = snapshotWithItems.items,
            reason = event.reason
        )

        logger.info(
            "[재고 복원 완료] orderPublicId={} | orderSnapshotId={} | items={}개",
            event.orderPublicId, event.orderSnapshotId, snapshotWithItems.items.size
        )
    }
}
