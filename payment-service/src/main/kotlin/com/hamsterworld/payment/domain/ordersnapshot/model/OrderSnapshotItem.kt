package com.hamsterworld.payment.domain.ordersnapshot.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "product_order_snapshot_items",
    indexes = [
        Index(name = "idx_snapshot_id", columnList = "snapshot_id"),
        Index(name = "idx_product_id", columnList = "product_id"),
        Index(name = "idx_ecommerce_product_public_id", columnList = "ecommerce_product_public_id"),
        Index(name = "idx_merchant_public_id", columnList = "merchant_public_id")
    ]
)
class OrderSnapshotItem(
    @Column(name = "snapshot_id", nullable = false)
    var snapshotId: Long = 0,

    @Column(name = "product_id", nullable = false)
    var productId: Long,

    @Column(name = "ecommerce_product_public_id", nullable = false, length = 20)
    var ecommerceProductPublicId: String,

    @Column(name = "merchant_public_id", nullable = false, length = 20)
    var merchantPublicId: String,

    @Column(nullable = false)
    var quantity: Int,

    @Column(nullable = false, precision = 15, scale = 3)
    var price: BigDecimal
) : AbsDomain() {

    constructor() : this(0, 0, "", "", 0, BigDecimal.ZERO)
}
