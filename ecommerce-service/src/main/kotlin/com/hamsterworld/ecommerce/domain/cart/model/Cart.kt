package com.hamsterworld.ecommerce.domain.cart.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*

@Entity
@Table(
    name = "carts",
    indexes = [
        Index(name = "idx_carts_public_id", columnList = "public_id", unique = true)
    ]
)
class Cart(
    @Column(nullable = false, name = "user_id")
    var userId: Long,

    @Column(length = 100)
    var name: String? = null
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        userId: Long = this.userId,
        name: String? = this.name
    ): Cart {
        val copied = Cart(
            userId = userId,
            name = name
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }
}
