package com.hamsterworld.ecommerce.app.coupon.request
import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import java.time.LocalDate
data class UserCouponSearchRequest(
    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = false,
    override val page: Int = 0,
    override val size: Int = 20,
    val status: UserCouponStatus? = null,
    val productPublicIds: Set<String> = emptySet()
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
