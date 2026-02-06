package com.hamsterworld.payment.domain.product.handler

import com.hamsterworld.payment.domain.product.event.InternalProductStockChangedEvent
import com.hamsterworld.payment.domain.product.model.Product
import com.hamsterworld.payment.domain.product.repository.ProductRepository
import com.hamsterworld.payment.domain.productrecord.model.ProductRecord
import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.domain.productrecord.repository.ProductRecordRepository
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.stereotype.Component

/**
 * Product 도메인 이벤트 핸들러
 *
 * ## 역할
 * - InternalProductStockChangedEvent 수신 시 ProductRecord 생성 (Event Sourcing)
 * - Product.updateStock() 호출 시 자동으로 재고 이력 기록
 * - isRecord=true일 때 재고 재집계 수행
 *
 * ## 처리 흐름
 * 1. InternalProductStockChangedEvent 수신 (내부 이벤트)
 * 2. ProductRecord 생성 및 저장
 * 3. 재고 재집계 (isRecord=true)
 *
 * ## 주의
 * - ProductStockSynchronizedEvent는 Product 도메인 모델에서 직접 발행
 * - 이 핸들러는 재집계만 담당
 */
@Component
class ProductEventHandler(
    private val productRepository: ProductRepository,
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>
) {
    private val log = LoggerFactory.getLogger(ProductEventHandler::class.java)

    /**
     * 재고 변경 이벤트 핸들러 (이벤트 소싱)
     *
     * InternalProductStockChangedEvent를 받아서:
     * 1. 이벤트에서 Product 객체 사용 (영속성 컨텍스트 재조회 방지)
     * 2. ProductRecord 생성 (변화량 delta만 저장)
     * 3. isRecord=true면 재고 재집계
     */
    @EventListener
    fun handle(event: InternalProductStockChangedEvent) {
        val product = event.product

        log.debug("[재고 변경 이벤트 수신] publicId={}, stockDelta={}, currentStock={}, reason={}",
            product.publicId, event.stockDelta, product.stock, event.reason)

        // ProductRecord 생성 (이벤트 소싱 - 변화량 delta만 저장)
        val record = ProductRecord(
            productId = product.id!!,
            stock = event.stockDelta,  // 변화량(delta) 저장!
            reason = event.reason
        )

        val saved = productRecordRepository.save(record)
        log.debug("[재고 이력 저장 완료] recordId={}, productId={}, stockDelta={}, reason={}",
            saved.id, saved.productId, saved.stock, saved.reason)

        if (event.isRecord) {
            // 이벤트 소싱: ProductRecord 이력을 기반으로 재고 재집계
            val productId = product.id ?: throw IllegalStateException("Product ID cannot be null")
            val calcProduct = recordRepository.writeRecord(productId)
            log.debug("[재고 재집계 완료] productId={}, 최종수량={}, 변경량={}, 사유={}",
                calcProduct.id, calcProduct.stock, event.stockDelta, event.reason)
        }
    }
}
