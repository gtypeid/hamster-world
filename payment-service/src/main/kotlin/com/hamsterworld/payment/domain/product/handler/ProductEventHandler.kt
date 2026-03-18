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

@Component
class ProductEventHandler(
    private val productRepository: ProductRepository,
    private val productRecordRepository: ProductRecordRepository,
    private val recordRepository: RecordRepository<Product>
) {
    private val log = LoggerFactory.getLogger(ProductEventHandler::class.java)

    @EventListener
    fun handle(event: InternalProductStockChangedEvent) {
        val product = event.product

        log.debug("[재고 변경 이벤트 수신] publicId={}, stockDelta={}, currentStock={}, reason={}",
            product.publicId, event.stockDelta, product.stock, event.reason)

        val record = ProductRecord(
            productId = product.id!!,
            stock = event.stockDelta,
            reason = event.reason
        )

        val saved = productRecordRepository.save(record)
        log.debug("[재고 이력 저장 완료] recordId={}, productId={}, stockDelta={}, reason={}",
            saved.id, saved.productId, saved.stock, saved.reason)

        if (event.isRecord) {
            val productId = product.id ?: throw IllegalStateException("Product ID cannot be null")
            val calcProduct = recordRepository.writeRecord(productId)
            log.debug("[재고 재집계 완료] productId={}, 최종수량={}, 변경량={}, 사유={}",
                calcProduct.id, calcProduct.stock, event.stockDelta, event.reason)
        }
    }
}
