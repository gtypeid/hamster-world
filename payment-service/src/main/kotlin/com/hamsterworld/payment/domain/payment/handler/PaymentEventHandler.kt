package com.hamsterworld.payment.domain.payment.handler

import com.hamsterworld.payment.domain.ordersnapshot.repository.OrderSnapshotRepository
import com.hamsterworld.payment.domain.payment.event.InternalStockRestoreEvent
import com.hamsterworld.payment.domain.product.service.ProductService
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional

/**
 * Payment 도메인 이벤트 핸들러
 *
 * Payment 엔티티에서 발행하는 Internal 이벤트를 처리합니다.
 *
 * ## 처리 이벤트
 * - InternalStockRestoreEvent: 재고 복원 (결제 취소/실패 시)
 *
 * ## 실행 방식
 * - @EventListener: 동기 실행 (같은 트랜잭션)
 * - Propagation.MANDATORY: 반드시 기존 트랜잭션에 참여
 *
 * ## 트랜잭션 원자성
 * - Payment 생성 + 재고 복원이 하나의 트랜잭션
 * - 재고 복원 실패 → Payment 생성도 롤백
 */
@Component
class PaymentEventHandler(
    private val orderSnapshotRepository: OrderSnapshotRepository,
    private val productService: ProductService
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 재고 복원 Internal 이벤트 처리
     *
     * ## 처리 내용
     * 1. OrderSnapshot 조회 (orderSnapshotId)
     * 2. OrderSnapshotItem들 조회
     * 3. productService.restoreStockForOrder() 호출
     *
     * ## 트랜잭션
     * - MANDATORY: Payment save() 트랜잭션에 참여
     * - 동기 실행: Payment 저장 직후 바로 실행
     *
     * ## 주의사항
     * - OrderSnapshot이 없으면 IllegalStateException 발생 (롤백)
     * - 재고 복원 실패 시 Payment 생성도 롤백됨
     *
     * @param event InternalStockRestoreEvent
     */
    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    fun handleInternalStockRestore(event: InternalStockRestoreEvent) {
        logger.info(
            "[재고 복원 시작] orderPublicId={} | orderSnapshotId={} | reason={}",
            event.orderPublicId, event.orderSnapshotId, event.reason
        )

        // OrderSnapshot + Items 조회
        val snapshotWithItems = orderSnapshotRepository.findByOrderSnapshotIdWithItems(event.orderSnapshotId)
        if (snapshotWithItems == null) {
            logger.error(
                "[재고 복원 실패] OrderSnapshot 없음 | orderPublicId={} | orderSnapshotId={}",
                event.orderPublicId, event.orderSnapshotId
            )
            throw IllegalStateException("OrderSnapshot을 찾을 수 없습니다. orderSnapshotId=${event.orderSnapshotId}")
        }

        // 재고 복원
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
