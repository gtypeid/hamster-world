package com.hamsterworld.ecommerce.app.product.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.product.constant.ProductCategory
import java.math.BigDecimal
import java.time.LocalDate

/**
 * 상품 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class ProductSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,

    val sku: String? = null,
    val name: String? = null,
    val category: ProductCategory? = null,
    val minPrice: BigDecimal? = null,
    val maxPrice: BigDecimal? = null,
    val onlyAvailable: Boolean = false  // true면 재고 있는 것만
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
