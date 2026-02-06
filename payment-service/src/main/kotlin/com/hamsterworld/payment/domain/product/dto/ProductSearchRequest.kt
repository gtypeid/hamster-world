package com.hamsterworld.payment.domain.product.dto

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.payment.domain.product.constant.ProductCategory
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Product 검색 요청
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

    // Product specific
    val name: String? = null,
    val minPrice: BigDecimal? = null,
    val maxPrice: BigDecimal? = null,
    val categories: Set<ProductCategory>? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
