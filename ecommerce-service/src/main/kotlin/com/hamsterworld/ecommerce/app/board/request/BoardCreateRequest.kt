package com.hamsterworld.ecommerce.app.board.request

import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import jakarta.validation.constraints.*

/**
 * 게시글 작성 요청
 */
data class BoardCreateRequest(
    /**
     * 상품 Public ID
     */
    @field:NotBlank(message = "상품 ID는 필수입니다")
    val productPublicId: String,

    /**
     * 카테고리 (REVIEW or INQUIRY)
     */
    @field:NotNull(message = "카테고리는 필수입니다")
    val category: BoardCategory,

    /**
     * 제목
     */
    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(max = 200, message = "제목은 200자 이하여야 합니다")
    val title: String,

    /**
     * 내용
     */
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String,

    /**
     * 별점 (1-5, 리뷰일 때만)
     */
    @field:Min(value = 1, message = "별점은 1 이상이어야 합니다")
    @field:Max(value = 5, message = "별점은 5 이하여야 합니다")
    val rating: Int? = null
)
