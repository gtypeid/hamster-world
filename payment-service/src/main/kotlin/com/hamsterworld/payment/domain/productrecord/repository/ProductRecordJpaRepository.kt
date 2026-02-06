package com.hamsterworld.payment.domain.productrecord.repository

import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import org.springframework.data.jpa.repository.JpaRepository

interface ProductRecordJpaRepository : JpaRepository<ProductRecord, Long> {

    /**
     * Product ID로 모든 ProductRecord 조회
     */
    fun findByProductId(productId: Long): List<ProductRecord>
}
