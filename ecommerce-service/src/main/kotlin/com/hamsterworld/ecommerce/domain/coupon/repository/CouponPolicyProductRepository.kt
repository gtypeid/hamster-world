package com.hamsterworld.ecommerce.domain.coupon.repository
import com.hamsterworld.ecommerce.domain.coupon.model.CouponPolicyProduct
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import org.springframework.stereotype.Repository
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
    fun findByCouponPolicyId(couponPolicyId: Long): List<CouponPolicyProduct> {
        return jpaRepository.findByCouponPolicyId(couponPolicyId)
    }
    fun findByProductId(productId: Long): List<CouponPolicyProduct> {
        return jpaRepository.findByProductId(productId)
    }
    fun findByProductIds(productIds: List<Long>): List<CouponPolicyProduct> {
        if (productIds.isEmpty()) return emptyList()
        return jpaRepository.findByProductIdIn(productIds)
    }
    fun findByCouponPolicyIds(couponPolicyIds: List<Long>): List<CouponPolicyProduct> {
        if (couponPolicyIds.isEmpty()) return emptyList()
        return jpaRepository.findByCouponPolicyIdIn(couponPolicyIds)
    }
    fun resolveEligiblePolicyIds(productPublicIds: Set<String>): Set<Long>? {
        if (productPublicIds.isEmpty()) return null
        val products = productRepository.findByPublicIds(productPublicIds.toList())
        val cartProductIds = products.map { it.id!! }
        if (cartProductIds.isEmpty()) return null
        val matchingPolicyIds = jpaRepository.findByProductIdIn(cartProductIds)
            .map { it.couponPolicyId }
            .toSet()
        val universalPolicyIds = couponPolicyRepository.findUniversalActivePolicies()
            .map { it.id!! }
            .toSet()
        return matchingPolicyIds + universalPolicyIds
    }
    fun deleteByCouponPolicyId(couponPolicyId: Long) {
        jpaRepository.deleteByCouponPolicyId(couponPolicyId)
    }
}
