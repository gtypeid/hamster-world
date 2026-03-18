package com.hamsterworld.ecommerce.domain.coupon.model
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
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
    @Column(name = "coupon_policy_id", nullable = false)
    var couponPolicyId: Long = 0,
    @Column(name = "product_id", nullable = false)
    var productId: Long = 0
) : AbsDomain() {
    companion object {
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
