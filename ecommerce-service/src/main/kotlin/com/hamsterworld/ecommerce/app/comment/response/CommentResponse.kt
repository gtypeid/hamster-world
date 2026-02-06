package com.hamsterworld.ecommerce.app.comment.response

import com.hamsterworld.ecommerce.domain.comment.model.Comment
import java.time.LocalDateTime

/**
 * 댓글 응답
 */
data class CommentResponse(
    val publicId: String,
    val boardPublicId: String,
    val authorPublicId: String,
    val authorName: String,
    val content: String,
    val parentPublicId: String?,
    val isSeller: Boolean,
    val createdAt: LocalDateTime,
    val modifiedAt: LocalDateTime?
) {
    companion object {
        fun from(
            comment: Comment,
            boardPublicId: String,
            authorPublicId: String,
            parentPublicId: String?
        ): CommentResponse {
            return CommentResponse(
                publicId = comment.publicId,
                boardPublicId = boardPublicId,
                authorPublicId = authorPublicId,
                authorName = comment.authorName,
                content = comment.content,
                parentPublicId = parentPublicId,
                isSeller = comment.isSeller,
                createdAt = comment.createdAt,
                modifiedAt = comment.modifiedAt
            )
        }
    }
}
