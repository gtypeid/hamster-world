package com.hamsterworld.payment.domain.ordersnapshot.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

/**
 * OrderSnapshotItem (Rich Domain Model)
 *
 * **목적**: 주문 스냅샷의 개별 항목 저장
 *
 * **관계**: OrderSnapshot과 논리적 관계만 존재 (물리적 FK 없음)
 */
@Entity
@Table(
    name = "product_order_snapshot_items",
    indexes = [
        Index(name = "idx_snapshot_id", columnList = "snapshot_id"),
        Index(name = "idx_product_id", columnList = "product_id"),
        Index(name = "idx_ecommerce_product_public_id", columnList = "ecommerce_product_public_id")
    ]
)
class OrderSnapshotItem(
    @Column(name = "snapshot_id", nullable = false)
    var snapshotId: Long = 0,

    @Column(name = "product_id", nullable = false)
    var productId: Long,  // Payment Service Product의 Internal PK (서비스 내부 FK)

    @Column(name = "ecommerce_product_public_id", nullable = false, length = 20)
    var ecommerceProductPublicId: String,  // E-commerce Service Product의 Public ID (Kafka 이벤트용, Snowflake Base62)

    @Column(nullable = false)
    var quantity: Int,

    @Column(nullable = false, precision = 15, scale = 3)
    var price: BigDecimal
) : AbsDomain() {

    /**
     * AbsDomain 생성자 호출용
     */
    constructor() : this(0, 0, "", 0, BigDecimal.ZERO)
}
