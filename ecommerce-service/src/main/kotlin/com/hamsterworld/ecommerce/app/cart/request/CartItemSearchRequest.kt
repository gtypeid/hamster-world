package com.hamsterworld.ecommerce.app.cart.request

import com.fasterxml.jackson.annotation.JsonIgnore
import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import io.swagger.v3.oas.annotations.Parameter
import java.time.LocalDate

/**
 * 장바구니 아이템 검색 요청
 *
 * 외부 API에서는 public_id (String)를 사용
 */
data class CartItemSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 5,

    val productPublicIds: Set<String> = emptySet(),
    val productName: String? = null,
    // TODO: ProductCategory는 외부 Product 서비스에서 정의
    val productCategories: Set<String> = emptySet(),

    // root Key (내부 사용, Swagger에서 숨김)
    @JsonIgnore
    @Parameter(hidden = true)
    val cartId: Long? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
