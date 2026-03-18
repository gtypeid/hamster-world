package com.hamsterworld.ecommerce.domain.comment.service
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.comment.request.CommentCreateRequest
import com.hamsterworld.ecommerce.app.comment.request.CommentUpdateRequest
import com.hamsterworld.ecommerce.app.comment.response.CommentResponse
import com.hamsterworld.ecommerce.domain.comment.model.Comment
import com.hamsterworld.ecommerce.domain.comment.repository.CommentRepository
import com.hamsterworld.ecommerce.domain.board.repository.BoardRepository
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val boardRepository: BoardRepository,
    private val userRepository: UserRepository
) {
    @Transactional
    fun create(
        boardPublicId: String,
        request: CommentCreateRequest,
        authorPublicId: String,
        authorName: String
    ): Comment {
        val board = boardRepository.findByPublicId(boardPublicId)
        val author = userRepository.findByPublicId(authorPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $authorPublicId")
        val parentId = request.parentPublicId?.let { parentPublicId ->
            commentRepository.findByPublicId(parentPublicId).id
        }
        val comment = Comment(
            boardId = board.id!!,
            authorId = author.id!!,
            authorName = authorName,
            content = request.content,
            parentId = parentId,
            isSeller = false
        )
        return commentRepository.save(comment)
    }
    @Transactional(readOnly = true)
    fun getByPublicId(publicId: String): Comment {
        return commentRepository.findByPublicId(publicId)
    }
    @Transactional(readOnly = true)
    fun getByPublicIdWithPublicIds(publicId: String): CommentWithPublicIds {
        val comment = commentRepository.findByPublicId(publicId)
        val board = boardRepository.findById(comment.boardId)
        val author = userRepository.findById(comment.authorId)
        val parentPublicId = comment.parentId?.let { parentId ->
            commentRepository.findById(parentId).publicId
        }
        return CommentWithPublicIds(
            comment = comment,
            boardPublicId = board.publicId,
            authorPublicId = author.publicId,
            parentPublicId = parentPublicId
        )
    }
    @Transactional(readOnly = true)
    fun getCommentsByBoardPublicId(boardPublicId: String): List<Comment> {
        val board = boardRepository.findByPublicId(boardPublicId)
        return commentRepository.findByBoardId(board.id!!)
    }
    @Transactional(readOnly = true)
    fun getCommentsByBoardPublicIdWithPublicIds(boardPublicId: String): List<CommentWithPublicIds> {
        val board = boardRepository.findByPublicId(boardPublicId)
        val comments = commentRepository.findByBoardId(board.id!!)
        if (comments.isEmpty()) return emptyList()
        val authorIds = comments.map { it.authorId }.distinct()
        val parentIds = comments.mapNotNull { it.parentId }.distinct()
        val authors = userRepository.findByIds(authorIds).associateBy { it.id!! }
        val parentComments = if (parentIds.isNotEmpty()) {
            commentRepository.findByIds(parentIds).associateBy { it.id!! }
        } else {
            emptyMap()
        }
        return comments.map { comment ->
            val author = authors[comment.authorId]
                ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${comment.authorId}")
            val parentPublicId = comment.parentId?.let { parentId ->
                parentComments[parentId]?.publicId
            }
            CommentWithPublicIds(
                comment = comment,
                boardPublicId = board.publicId,
                authorPublicId = author.publicId,
                parentPublicId = parentPublicId
            )
        }
    }
    @Transactional
    fun createAndReturnDto(
        boardPublicId: String,
        request: CommentCreateRequest,
        authorPublicId: String,
        authorName: String
    ): CommentResponse {
        val comment = create(boardPublicId, request, authorPublicId, authorName)
        val commentWithIds = getByPublicIdWithPublicIds(comment.publicId)
        return CommentResponse.from(
            commentWithIds.comment,
            commentWithIds.boardPublicId,
            commentWithIds.authorPublicId,
            commentWithIds.parentPublicId
        )
    }
    @Transactional
    fun updateAndReturnDto(publicId: String, request: CommentUpdateRequest, userPublicId: String): CommentResponse {
        val comment = update(publicId, request, userPublicId)
        val commentWithIds = getByPublicIdWithPublicIds(comment.publicId)
        return CommentResponse.from(
            commentWithIds.comment,
            commentWithIds.boardPublicId,
            commentWithIds.authorPublicId,
            commentWithIds.parentPublicId
        )
    }
    data class CommentWithPublicIds(
        val comment: Comment,
        val boardPublicId: String,
        val authorPublicId: String,
        val parentPublicId: String?
    )
    @Transactional
    fun update(publicId: String, request: CommentUpdateRequest, userPublicId: String): Comment {
        val comment = commentRepository.findByPublicId(publicId)
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")
        if (comment.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 댓글만 수정할 수 있습니다")
        }
        val updatedComment = comment.update(request.content)
        return commentRepository.update(updatedComment)
    }
    @Transactional
    fun delete(publicId: String, userPublicId: String) {
        val comment = commentRepository.findByPublicId(publicId)
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")
        if (comment.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 댓글만 삭제할 수 있습니다")
        }
        commentRepository.delete(comment.id!!)
    }
}
