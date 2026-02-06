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

    /**
     * Product ID로 모든 ProductRecord 조회
     *
     * @param productId Product ID
     * @return ProductRecord 목록 (재고 변동 이력)
     */
    fun findByProductId(productId: Long): List<ProductRecord> {
        return productRecordJpaRepository.findByProductId(productId)
    }
}
