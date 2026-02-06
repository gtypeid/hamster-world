package com.hamsterworld.ecommerce.app.board.response

import com.hamsterworld.ecommerce.app.comment.response.CommentResponse
import com.hamsterworld.ecommerce.domain.board.service.BoardService
import com.hamsterworld.ecommerce.domain.comment.service.CommentService

/**
 * 게시글 + 댓글 응답
 */
data class BoardWithCommentsResponse(
    val board: BoardResponse,
    val comments: List<CommentResponse>
) {
    companion object {
        fun from(
            boardWithIds: BoardService.BoardWithPublicIds,
            commentsWithIds: List<CommentService.CommentWithPublicIds>
        ): BoardWithCommentsResponse {
            return BoardWithCommentsResponse(
                board = BoardResponse.from(
                    boardWithIds.board,
                    boardWithIds.productPublicId,
                    boardWithIds.authorPublicId,
                    commentsWithIds.size
                ),
                comments = commentsWithIds.map { commentWithIds ->
                    CommentResponse.from(
                        commentWithIds.comment,
                        commentWithIds.boardPublicId,
                        commentWithIds.authorPublicId,
                        commentWithIds.parentPublicId
                    )
                }
            )
        }
    }
}
