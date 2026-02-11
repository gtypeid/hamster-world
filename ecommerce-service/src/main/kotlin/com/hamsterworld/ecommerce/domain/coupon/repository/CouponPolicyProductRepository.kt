package com.hamsterworld.ecommerce.domain.coupon.repository

import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicyProduct
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import org.springframework.stereotype.Repository

/**
 * Coupon Policy Product Repository
 *
 * 쿠폰 정책 → 대상 상품 매핑 레포지토리
 */
@Repository
class CouponPolicyProductRepository(
    private val jpaRepository: CouponPolicyProductJpaRepository,
    private val productRepository: ProductRepository,
    private val couponPolicyRepository: CouponPolicyRepository
) {

    fun save(couponPolicyProduct: CouponPolicyProduct): CouponPolicyProduct {
        return jpaRepository.save(couponPolicyProduct)
    }

    fun saveAll(couponPolicyProducts: List<CouponPolicyProduct>): List<CouponPolicyProduct> {
        return jpaRepository.saveAll(couponPolicyProducts)
    }

    /**
     * 쿠폰 정책의 대상 상품 목록 조회
     */
    fun findByCouponPolicyId(couponPolicyId: Long): List<CouponPolicyProduct> {
        return jpaRepository.findByCouponPolicyId(couponPolicyId)
    }

    /**
     * 상품 ID로 해당 상품을 대상으로 하는 쿠폰 정책 매핑 조회
     *
     * 용도: "이 상품에 적용 가능한 쿠폰 조회"
     */
    fun findByProductId(productId: Long): List<CouponPolicyProduct> {
        return jpaRepository.findByProductId(productId)
    }

    /**
     * 상품 ID 목록으로 해당 상품들을 대상으로 하는 쿠폰 정책 매핑 일괄 조회 (배치)
     */
    fun findByProductIds(productIds: List<Long>): List<CouponPolicyProduct> {
        if (productIds.isEmpty()) return emptyList()
        return jpaRepository.findByProductIdIn(productIds)
    }

    /**
     * 쿠폰 정책 ID 목록으로 대상 상품 일괄 조회 (배치, N+1 방지)
     */
    fun findByCouponPolicyIds(couponPolicyIds: List<Long>): List<CouponPolicyProduct> {
        if (couponPolicyIds.isEmpty()) return emptyList()
        return jpaRepository.findByCouponPolicyIdIn(couponPolicyIds)
    }

    /**
     * 상품 Public IDs 기반 eligible couponPolicyIds 조회
     *
     * 장바구니 상품 기반 쿠폰 필터링에 사용.
     * productPublicIds가 비어있으면 null (필터 없음).
     *
     * ## 로직
     * 1. productPublicIds → Product Internal IDs 변환
     * 2. 상품 매칭 정책: CouponPolicyProduct에서 cartProductIds IN 조회 → policyIds
     * 3. 유니버설 정책: CouponPolicyProduct가 없는 ACTIVE 정책 → policyIds
     * 4. 합산 반환
     */
    fun resolveEligiblePolicyIds(productPublicIds: Set<String>): Set<Long>? {
        if (productPublicIds.isEmpty()) return null

        // 1. Public ID → Internal ID
        val products = productRepository.findByPublicIds(productPublicIds.toList())
        val cartProductIds = products.map { it.id!! }

        if (cartProductIds.isEmpty()) return null

        // 2. 상품 매칭 정책
        val matchingPolicyIds = jpaRepository.findByProductIdIn(cartProductIds)
            .map { it.couponPolicyId }
            .toSet()

        // 3. 유니버설 정책
        val universalPolicyIds = couponPolicyRepository.findUniversalActivePolicies()
            .map { it.id!! }
            .toSet()

        // 4. 합산
        return matchingPolicyIds + universalPolicyIds
    }

    /**
     * 쿠폰 정책의 대상 상품 전체 삭제 (정책 갱신 시)
     */
    fun deleteByCouponPolicyId(couponPolicyId: Long) {
        jpaRepository.deleteByCouponPolicyId(couponPolicyId)
    }
}
