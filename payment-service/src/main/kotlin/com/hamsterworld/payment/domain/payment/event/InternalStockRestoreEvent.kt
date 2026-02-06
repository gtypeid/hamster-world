package com.hamsterworld.payment.domain.payment.event

/**
 * 재고 복원 Internal 이벤트
 *
 * Payment Service 내부 → PaymentEventHandler (Spring @EventListener)
 *
 * ## 목적
 * - Payment 생성 시 재고 복원을 자동으로 처리
 * - Consumer에서 명시적으로 productService.restoreStockForOrder() 호출 불필요
 *
 * ## 처리 흐름
 * 1. Payment.createCancelled() 호출 시 이 이벤트 등록
 * 2. paymentRepository.save() → Spring Data JPA @DomainEvents 발행
 * 3. PaymentEventHandler.handleInternalStockRestore() 동기 실행 (같은 트랜잭션)
 * 4. OrderSnapshot 조회 → productService.restoreStockForOrder()
 *
 * ## 특징
 * - **Internal**: Kafka 전송 안 됨 (Spring ApplicationEventPublisher만 사용)
 * - **동기 실행**: @EventListener로 같은 트랜잭션에서 실행
 * - **트랜잭션 원자성**: Payment 생성 + 재고 복원이 하나의 트랜잭션
 *
 * ## 주의사항
 * - Kafka 이벤트(PaymentCancelConfirmedEvent)보다 먼저 등록해야 함
 * - 재고 복원 실패 시 Payment 생성도 롤백됨
 */
data class InternalStockRestoreEvent(
    val orderPublicId: String,      // Ecommerce Order Public ID
    val orderSnapshotId: Long,      // OrderSnapshot ID (재고 복원 데이터 조회용)
    val reason: String              // 복원 사유
)
