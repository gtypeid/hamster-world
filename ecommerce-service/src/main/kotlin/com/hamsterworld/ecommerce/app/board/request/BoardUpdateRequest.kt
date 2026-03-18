package com.hamsterworld.ecommerce.app.board.request
import jakarta.validation.constraints.*
data class BoardUpdateRequest(
    @field:NotBlank(message = "제목은 필수입니다")
    @field:Size(max = 200, message = "제목은 200자 이하여야 합니다")
    val title: String,
    @field:NotBlank(message = "내용은 필수입니다")
    val content: String,
    @field:Min(value = 1, message = "별점은 1 이상이어야 합니다")
    @field:Max(value = 5, message = "별점은 5 이하여야 합니다")
    val rating: Int? = null
)
