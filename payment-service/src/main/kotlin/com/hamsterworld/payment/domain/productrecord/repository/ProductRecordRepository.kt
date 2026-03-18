package com.hamsterworld.payment.domain.productrecord.repository

import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import org.springframework.stereotype.Repository

@Repository
class ProductRecordRepository(
    private val productRecordJpaRepository: ProductRecordJpaRepository
) {

    fun save(productRecord: ProductRecord): ProductRecord {
        return productRecordJpaRepository.save(productRecord)
    }

    fun findByProductId(productId: Long): List<ProductRecord> {
        return productRecordJpaRepository.findByProductId(productId)
    }
}
