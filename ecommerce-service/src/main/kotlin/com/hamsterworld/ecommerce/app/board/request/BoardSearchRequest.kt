package com.hamsterworld.ecommerce.app.board.request

import com.hamsterworld.common.app.AppPagedSearchQuery
import com.hamsterworld.common.app.SortDirection
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import java.time.LocalDate

/**
 * 게시판 검색 요청
 *
 * 상품 상세 페이지에서 리뷰/문의를 조회할 때 사용
 * - productPublicId: 단일 상품 (필수)
 * - category: REVIEW or INQUIRY (필수)
 */
data class BoardSearchRequest(
    /**
     * 상품 Public ID (필수 - 단일 상품)
     */
    val productPublicId: String,

    /**
     * 게시판 카테고리 (필수)
     * - REVIEW: 리뷰
     * - INQUIRY: 문의
     */
    val category: BoardCategory? = null,

    /**
     * 작성자 필터 (선택)
     */
    val authorPublicId: String? = null,

    override val from: LocalDate? = null,
    override val to: LocalDate? = null,
    override val match: Boolean = false,
    override val sort: SortDirection = SortDirection.DESC,
    override val publicIds: Set<String> = emptySet(),
    override val paged: Boolean = true,
    override val page: Int = 0,
    override val size: Int = 20
) : AppPagedSearchQuery(from, to, match, sort, publicIds, paged, page, size)
