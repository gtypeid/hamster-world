package com.hamsterworld.ecommerce.app.comment.request

import jakarta.validation.constraints.NotBlank

/**
 * 댓글 작성 요청
 */
data class CommentCreateRequest(
    /**
     * 댓글 내용
     */
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String,

    /**
     * 부모 댓글 Public ID (대댓글일 경우)
     */
    val parentPublicId: String? = null
)
