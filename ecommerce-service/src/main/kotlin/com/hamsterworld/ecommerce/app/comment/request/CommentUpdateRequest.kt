package com.hamsterworld.ecommerce.app.comment.request
import jakarta.validation.constraints.NotBlank
data class CommentUpdateRequest(
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String
)
