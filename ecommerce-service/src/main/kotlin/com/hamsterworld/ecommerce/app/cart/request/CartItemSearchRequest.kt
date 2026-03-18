package com.hamsterworld.ecommerce.app.cart.request
import com.fasterxml.jackson.annotation.JsonIgnore
import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import io.swagger.v3.oas.annotations.Parameter
import java.time.LocalDate
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
    val productCategories: Set<String> = emptySet(),
    @JsonIgnore
    @Parameter(hidden = true)
    val cartId: Long? = null
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
