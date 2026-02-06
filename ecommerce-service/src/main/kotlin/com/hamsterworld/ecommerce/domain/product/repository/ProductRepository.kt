package com.hamsterworld.ecommerce.domain.product.repository

import com.hamsterworld.common.web.QuerydslExtension
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.eqOrNull
import com.hamsterworld.common.web.QuerydslExtension.inOrNullSafe
import com.hamsterworld.common.web.QuerydslExtension.match
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.product.request.ProductSearchRequest
import com.hamsterworld.ecommerce.domain.product.model.Product
import com.hamsterworld.ecommerce.domain.product.model.QProduct.product
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

@Repository
class ProductRepository(
    private val productJpaRepository: ProductJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(product: Product): Product {
        return productJpaRepository.save(product)
    }

    fun update(product: Product): Product {
        val entity = productJpaRepository.findById(product.id!!)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${product.id}") }

        // 엔티티 필드 업데이트
        entity.sku = product.sku
        entity.name = product.name
        entity.description = product.description
        entity.price = product.price
        entity.category = product.category
        entity.isSoldOut = product.isSoldOut
        entity.stock = product.stock
        entity.modifiedAt = product.modifiedAt

        return productJpaRepository.save(entity)
    }

    fun findById(id: Long): Product {
        return productJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. ID: $id") }
    }

    fun findBySku(sku: String): Product {
        return productJpaRepository.findBySku(sku)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. SKU: $sku") }
    }

    fun findByPublicId(publicId: String): Product {
        return productJpaRepository.findByPublicId(publicId)
            .orElseThrow { CustomRuntimeException("상품을 찾을 수 없습니다. Public ID: $publicId") }
    }

    fun findByIds(ids: List<Long>): List<Product> {
        if (ids.isEmpty()) {
            return emptyList()
        }
        return jpaQueryFactory
            .selectFrom(product)
            .where(product.id.`in`(ids))
            .fetch()
    }

    fun existsById(id: Long): Boolean {
        return productJpaRepository.existsById(id)
    }

    fun existsBySku(sku: String): Boolean {
        return productJpaRepository.existsBySku(sku)
    }

    fun search(request: ProductSearchRequest): List<Product> {
        val query = baseQuery(request)

        return QuerydslExtension.applySorts(query, product.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: ProductSearchRequest): Page<Product> {
        val baseQuery = baseQuery(request)

        // Count query
        val total = jpaQueryFactory
            .select(product.count())
            .from(product)
            .where(*searchListConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = QuerydslExtension.applySorts(pagedQuery, product.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }

    private fun baseQuery(request: ProductSearchRequest): com.querydsl.jpa.impl.JPAQuery<Product> {
        return jpaQueryFactory
            .selectFrom(product)
            .where(*searchListConditions(request).toTypedArray())
    }

    fun delete(id: Long) {
        productJpaRepository.deleteById(id)
    }

    private fun searchListConditions(search: ProductSearchRequest): List<BooleanExpression> {
        return listOfNotNull(
            between(product.createdAt, search.from, search.to),
            inOrNullSafe(product.publicId, search.publicIds),
            match(product.sku, search.sku, search.match),
            match(product.name, search.name, search.match),
            eqOrNull(product.category, search.category),
            between(product.price, search.minPrice, search.maxPrice),
            if (search.onlyAvailable) product.isSoldOut.isFalse else null
        )
    }
}
