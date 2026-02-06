package com.hamsterworld.common.domain.eventsourcing

/**
 * 이벤트 소싱 기반 재집계 Repository 인터페이스
 *
 * ## Event Sourcing Pattern
 * - Record 이력으로부터 Aggregate 상태를 재계산
 * - 예: Product는 ProductRecord들의 합산으로 재고를 계산
 *
 * ## 사용 예시
 * ```kotlin
 * class ProductRepository : RecordRepository<Product> {
 *     override fun readRecord(id: Long): Product {
 *         val records = productRecordRepository.findByProductId(id)
 *         val totalStock = records.sumOf { it.stock }
 *         return product.copy(stock = totalStock)
 *     }
 *
 *     override fun writeRecord(id: Long): Product {
 *         val product = findByIdForUpdate(id)  // 비관적 락
 *         val records = productRecordRepository.findByProductId(id)
 *         val totalStock = records.sumOf { it.stock }
 *         return save(product.copy(stock = totalStock))
 *     }
 * }
 * ```
 */
interface RecordRepository<T> {
    /**
     * 이벤트 이력을 기반으로 도메인 상태를 재계산 (읽기 전용)
     *
     * @param id Aggregate ID
     * @return 재집계된 도메인 객체
     */
    fun readRecord(id: Long): T

    /**
     * 이벤트 이력을 기반으로 도메인 상태를 재계산하고 DB에 저장 (쓰기)
     *
     * 비관적 락을 사용하여 동시성 제어
     *
     * @param id Aggregate ID
     * @return 재집계 후 저장된 도메인 객체
     */
    fun writeRecord(id: Long): T
}
