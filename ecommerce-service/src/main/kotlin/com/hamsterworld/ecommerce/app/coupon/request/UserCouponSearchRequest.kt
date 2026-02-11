package com.hamsterworld.ecommerce.app.coupon.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.coupon.constant.UserCouponStatus
import java.time.LocalDate

/**
 * 사용자 쿠폰 검색 요청
 *
 * ## 필터 조건
 * - status: 쿠폰 상태 (AVAILABLE, USED, EXPIRED)
 * - productPublicIds: 장바구니 상품 Public ID 목록 (상품 기반 필터링)
 *
 * ## 상품 기반 필터링 규칙
 * - productPublicIds가 비어있으면 상품 필터링 없이 전체 반환
 * - productPublicIds가 있으면:
 *   - 유니버설 쿠폰 (CouponPolicyProduct 없음): 무조건 포함
 *   - 상품 지정 쿠폰: 장바구니 상품과 교집합이 있으면 포함
 */
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
