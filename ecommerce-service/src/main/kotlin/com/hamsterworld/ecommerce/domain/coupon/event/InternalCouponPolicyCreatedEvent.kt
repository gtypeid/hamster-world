package com.hamsterworld.ecommerce.domain.coupon.event

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicy

/**
 * Internal Coupon Policy Created Event
 *
 * CouponPolicy 생성 시 발행되는 내부 이벤트 (동기, 같은 트랜잭션)
 *
 * ## 용도
 * - conditionFiltersJson의 productIds를 파싱하여 CouponPolicyProduct 하위 엔티티 생성
 *
 * ## 처리
 * - CouponPolicyEventHandler에서 @EventListener로 수신
 * - CouponPolicy.create() → registerEvent() → save() 시 발행
 */
data class InternalCouponPolicyCreatedEvent(
    val couponPolicy: CouponPolicy
)
