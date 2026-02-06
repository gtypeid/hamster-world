package com.hamsterworld.payment.domain.productrecord.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table

@Entity
@Table(
    name = "product_records",
    indexes = [
        Index(name = "idx_product_records_public_id", columnList = "public_id", unique = true)
    ]
)
class ProductRecord(
    @Column(nullable = false)
    var productId: Long,

    @Column(nullable = false)
    var stock: Int,

    @Column(nullable = false)
    var reason: String
) : AbsDomain()
