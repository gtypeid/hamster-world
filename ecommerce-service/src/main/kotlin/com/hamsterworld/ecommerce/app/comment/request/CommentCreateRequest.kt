package com.hamsterworld.ecommerce.app.comment.request
import jakarta.validation.constraints.NotBlank
data class CommentCreateRequest(
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String,
    val parentPublicId: String? = null
)
