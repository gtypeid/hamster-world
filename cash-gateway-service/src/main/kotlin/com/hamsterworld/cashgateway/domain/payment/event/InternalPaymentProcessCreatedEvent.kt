package com.hamsterworld.cashgateway.domain.payment.event

import com.hamsterworld.cashgateway.domain.paymentprocess.model.PaymentProcess

/**
 * 결제 프로세스 생성 내부 이벤트 (Spring ApplicationEvent)
 *
 * **Internal prefix**: Kafka 도메인 이벤트가 아닌 Spring 내부 이벤트임을 명시.
 * JPA @DomainEvents로 save() 시 자동 발행되며, 같은 서비스 내 @EventListener가 구독한다.
 *
 * **발행 시점**: PaymentProcess 생성 (PG 요청 전/후)
 *
 * **구독자**:
 * - ecommerce-service: Order 상태 → PAYMENT_PENDING (선택적)
 */
data class InternalPaymentProcessCreatedEvent(
    val process: PaymentProcess
)
