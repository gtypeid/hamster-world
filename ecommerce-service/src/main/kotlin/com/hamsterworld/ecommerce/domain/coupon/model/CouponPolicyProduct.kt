package com.hamsterworld.ecommerce.domain.coupon.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*

/**
 * Coupon Policy Product
 *
 * 쿠폰 정책 → 대상 상품 매핑 (하위 엔티티)
 *
 * CouponPolicy의 conditionFiltersJson에서 productIds(Public ID)를 추출하여
 * Product Internal ID로 변환 후 인덱스 가능한 형태로 저장.
 *
 * ## 용도
 * - "이 상품에 적용 가능한 쿠폰 조회" 시 인덱스 활용
 * - conditionFiltersJson은 검증용으로 유지, 이 테이블은 조회 최적화용
 *
 * ## 생성 시점
 * - CouponPolicy 생성 시 도메인 이벤트(InternalCouponPolicyCreatedEvent)로 동기 생성
 * - 핸들러에서 Public ID → Internal ID 변환 후 저장
 *
 * ## 테이블 구조
 * ```sql
 * CREATE TABLE coupon_policy_products (
 *     id BIGINT AUTO_INCREMENT PRIMARY KEY,
 *     public_id VARCHAR(20) NOT NULL UNIQUE,
 *     coupon_policy_id BIGINT NOT NULL,
 *     product_id BIGINT NOT NULL,
 *     created_at DATETIME NOT NULL,
 *     modified_at DATETIME
 * );
 * ```
 */
@Entity
@Table(
    name = "coupon_policy_products",
    indexes = [
        Index(name = "idx_cpp_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_cpp_coupon_policy_id", columnList = "coupon_policy_id"),
        Index(name = "idx_cpp_product_id", columnList = "product_id"),
        Index(
            name = "idx_cpp_policy_product",
            columnList = "coupon_policy_id, product_id",
            unique = true
        )
    ]
)
class CouponPolicyProduct(
    /**
     * 쿠폰 정책 ID (Internal FK)
     */
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,

    /**
     * 대상 상품 ID (Internal FK, 같은 서비스 내부)
     */
    @Column(name = "product_id", nullable = false)
    var productId: Long = 0
) : AbsDomain() {

    companion object {
        /**
         * CouponPolicyProduct 생성 팩토리 메서드
         */
        fun create(
            couponPolicyId: Long,
            productId: Long
        ): CouponPolicyProduct {
            return CouponPolicyProduct(
                couponPolicyId = couponPolicyId,
                productId = productId
            )
        }
    }
}
