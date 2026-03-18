package com.hamsterworld.payment.domain.product.repository

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.inOrNullSafe
import com.hamsterworld.common.web.QuerydslExtension.match
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.common.domain.eventsourcing.RecordRepository
import com.hamsterworld.payment.domain.product.dto.ProductSearchRequest
import com.hamsterworld.payment.domain.product.model.Product
import com.hamsterworld.payment.domain.product.model.QProduct.product
import com.hamsterworld.payment.domain.productrecord.model.QProductRecord.productRecord
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPQLQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Repository
class ProductRepository(
    private val productJpaRepository: ProductJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val eventPublisher: ApplicationEventPublisher
) : RecordRepository<Product> {

    fun save(product: Product): Product {
        return productJpaRepository.save(product)
    }

    @Transactional
    fun saveAndPublish(product: Product): Product {
        val saved = productJpaRepository.save(product)
        product.pullDomainEvents().forEach { eventPublisher.publishEvent(it) }
        return saved
    }

    fun findByWeekId(weekId: String): Product {
        return productJpaRepository.findByWeekId(weekId)
            .orElseThrow {
                CustomRuntimeException("상품을 찾을 수 없습니다. Week Id: $weekId")
            }
    }

    fun findByEcommerceProductId(ecommerceProductId: String): Product {
        return jpaQueryFactory.selectFrom(product)
            .where(product.ecommerceProductId.eq(ecommerceProductId))
            .fetchOne()
            ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. E-commerce Product ID: $ecommerceProductId")
    }

    fun findByPublicId(publicId: String): Product {
        return jpaQueryFactory.selectFrom(product)
            .where(product.publicId.eq(publicId))
            .fetchOne()
            ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. Public ID: $publicId")
    }

    fun findBySku(sku: String): Product {
        return productJpaRepository.findBySku(sku)
            .orElseThrow {
                CustomRuntimeException("상품을 찾을 수 없습니다. SKU: $sku")
            }
    }

    fun update(product: Product): Product {
        val copy = product.copy()
        copy.modifiedAt = LocalDateTime.now()
        return productJpaRepository.save(copy)
    }

    fun findById(id: Long): Product {
        return productJpaRepository.findById(id)
            .orElseThrow {
                CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id")
            }
    }

    fun findAll(search: ProductSearchRequest): List<Product> {
        val query = baseQuery(search)
        return applySorts(query, product.createdAt, search.sort)
            .fetch()
    }

    fun findAllPage(search: ProductSearchRequest): Page<Product> {
        val baseQuery = baseQuery(search)

        val total = jpaQueryFactory
            .select(product.count())
            .from(product)
            .where(*searchListConditions(search).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset(search.getOffset())
            .limit(search.size.toLong())

        val products = applySorts(pagedQuery, product.createdAt, search.sort)
            .fetch()

        return PageImpl(products, PageRequest.of(search.page, search.size), total)
    }

    fun delete(id: Long) {
        productJpaRepository.deleteById(id)
    }

    @Transactional(readOnly = true)
    override fun readRecord(id: Long): Product {
        return baseRecord(id)
    }

    @Transactional(propagation = Propagation.MANDATORY, isolation = Isolation.READ_COMMITTED)
    override fun writeRecord(id: Long): Product {
        val lockedEntity = productJpaRepository.findByIdForUpdate(id)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id") }

        val recalculated = baseRecord(id)

        lockedEntity.stock = recalculated.stock
        lockedEntity.isSoldOut = recalculated.isSoldOut
        lockedEntity.lastRecordedAt = recalculated.lastRecordedAt

        return lockedEntity
    }

    private fun baseRecord(id: Long): Product {
        val product = productJpaRepository.findById(id)
            .orElseThrow {
                CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id")
            }

        val calculatedStock = jpaQueryFactory
            .select(productRecord.stock.sum())
            .from(productRecord)
            .where(productRecord.productId.eq(id))
            .fetchOne()

        val totalStock = calculatedStock ?: 0
        if (totalStock < 0) {
            throw CustomRuntimeException("재고 불일치: 음수 재고가 계산되었습니다. (productId=$id, stock=$totalStock)")
        }

        return product.copy(
            stock = totalStock,
            isSoldOut = totalStock <= 0,
            lastRecordedAt = LocalDateTime.now()
        )
    }

    fun records(ids: Set<Long>): Set<Product> {
        if (ids.isEmpty()) return emptySet()

        val products = productJpaRepository.findAllById(ids)

        val stockMap = jpaQueryFactory
            .select(
                productRecord.productId,
                productRecord.stock.sum()
            )
            .from(productRecord)
            .where(productRecord.productId.`in`(ids))
            .groupBy(productRecord.productId)
            .fetch()
            .associate { tuple ->
                tuple.get(productRecord.productId)!! to (tuple.get(productRecord.stock.sum()) ?: 0)
            }

        val updatedProducts = products.map { product ->
            val totalStock = stockMap[product.id] ?: 0
            val updated = product.copy(
                stock = totalStock,
                isSoldOut = totalStock <= 0,
                lastRecordedAt = LocalDateTime.now()
            )

            productJpaRepository.save(updated)

            updated
        }

        return updatedProducts.toHashSet()
    }

    private fun baseQuery(
        search: ProductSearchRequest
    ): JPQLQuery<Product> {
        return jpaQueryFactory
            .selectFrom(product)
            .where(*searchListConditions(search).toTypedArray())
    }

    private fun searchListConditions(
        search: ProductSearchRequest
    ): List<BooleanExpression> {
        return listOfNotNull(
            between(product.createdAt, search.from, search.to),
            inOrNullSafe(product.publicId, search.publicIds),
            match(product.name, search.name, search.match),
            between(product.price, search.minPrice, search.maxPrice),
            inOrNullSafe(product.category, search.categories)
        )
    }
}
