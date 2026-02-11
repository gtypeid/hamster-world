package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicyProduct
import org.springframework.data.jpa.repository.JpaRepository

/**
 * Coupon Policy Product JPA Repository
 *
 * 간단한 JPA 쿼리 메서드
 */
interface CouponPolicyProductJpaRepository : JpaRepository<CouponPolicyProduct, Long> {
    /**
     * 쿠폰 정책 ID로 대상 상품 조회
     */
    fun findByCouponPolicyId(couponPolicyId: Long): List<CouponPolicyProduct>

    /**
     * 상품 ID로 해당 상품을 대상으로 하는 쿠폰 정책 매핑 조회
     */
    fun findByProductId(productId: Long): List<CouponPolicyProduct>

    /**
     * 상품 ID 목록으로 해당 상품들을 대상으로 하는 쿠폰 정책 매핑 일괄 조회 (배치)
     */
    fun findByProductIdIn(productIds: List<Long>): List<CouponPolicyProduct>

    /**
     * 쿠폰 정책 ID 목록으로 대상 상품 일괄 조회 (배치)
     */
    fun findByCouponPolicyIdIn(couponPolicyIds: List<Long>): List<CouponPolicyProduct>

    /**
     * 쿠폰 정책 ID로 대상 상품 전체 삭제
     */
    fun deleteByCouponPolicyId(couponPolicyId: Long)
}
