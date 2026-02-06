package com.hamsterworld.payment.domain.product.event

import com.hamsterworld.payment.domain.product.model.Product

/**
 * 재고 변경 이벤트 (내부 도메인 이벤트)
 *
 * Payment Service 내부 → ProductEventHandler (Spring @DomainEvents)
 *
 * ## 목적
 * - ProductRecord 생성 (Event Sourcing - stockDelta 필드 사용)
 * - ProductRecord에는 변화량(delta)만 저장
 * - ProductEventHandler에서 재고 재집계
 *
 * ## 주의사항
 * - 이 이벤트는 Kafka로 직접 전송되지 않음 (내부 이벤트)
 * - 외부 서비스(E-commerce) 동기화는 ProductStockSynchronizedEvent 사용
 * - Product 객체를 직접 포함하여 영속성 컨텍스트 조회 문제 방지
 */
data class InternalProductStockChangedEvent(
    val product: Product,             // Product 엔티티 (이미 clearDomainEvents() 호출된 상태)
    val stockDelta: Int,              // 재고 변화량 (delta) - ProductRecord에 저장
    val reason: String,               // 변경 사유
    val isRecord: Boolean = true      // 이벤트 소싱 재집계 여부
)
