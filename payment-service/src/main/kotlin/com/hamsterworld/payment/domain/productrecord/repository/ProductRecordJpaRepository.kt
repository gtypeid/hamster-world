package com.hamsterworld.payment.domain.productrecord.repository

import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import org.springframework.data.jpa.repository.JpaRepository

interface ProductRecordJpaRepository : JpaRepository<ProductRecord, Long> {

    fun findByProductId(productId: Long): List<ProductRecord>
}
