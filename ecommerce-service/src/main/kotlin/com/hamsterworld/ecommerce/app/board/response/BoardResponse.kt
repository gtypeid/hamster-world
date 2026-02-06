package com.hamsterworld.ecommerce.app.board.response

import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import com.hamsterworld.ecommerce.domain.board.model.Board
import java.time.LocalDateTime

/**
 * 게시글 응답
 */
data class BoardResponse(
    val publicId: String,
    val productPublicId: String,
    val category: BoardCategory,
    val authorPublicId: String,
    val authorName: String,
    val title: String,
    val content: String,
    val rating: Int?,
    val commentCount: Int,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(board: Board, productPublicId: String, authorPublicId: String, commentCount: Int): BoardResponse {
            return BoardResponse(
                publicId = board.publicId,
                productPublicId = productPublicId,
                category = board.category,
                authorPublicId = authorPublicId,
                authorName = board.authorName,
                title = board.title,
                content = board.content,
                rating = board.rating,
                commentCount = commentCount,
                createdAt = board.createdAt,
                modifiedAt = board.modifiedAt
            )
        }
    }
}
