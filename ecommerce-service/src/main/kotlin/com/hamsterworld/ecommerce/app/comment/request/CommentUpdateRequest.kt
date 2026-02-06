package com.hamsterworld.ecommerce.app.comment.request

import jakarta.validation.constraints.NotBlank

/**
 * 댓글 수정 요청
 */
data class CommentUpdateRequest(
    /**
     * 댓글 내용
     */
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String
)
