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

    /**
     * 댓글 작성
     */
    @Transactional
    fun create(
        boardPublicId: String,
        request: CommentCreateRequest,
        authorPublicId: String,
        authorName: String
    ): Comment {
        // Public ID → Internal PK 변환
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
            isSeller = false  // TODO: 판매자 여부 판단 로직 추가 필요
        )

        return commentRepository.save(comment)
    }

    /**
     * 댓글 조회 (Public ID)
     */
    @Transactional(readOnly = true)
    fun getByPublicId(publicId: String): Comment {
        return commentRepository.findByPublicId(publicId)
    }

    /**
     * 댓글 조회 (Public ID) + Board/Author/Parent Public IDs
     */
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

    /**
     * 특정 게시글의 모든 댓글 조회
     */
    @Transactional(readOnly = true)
    fun getCommentsByBoardPublicId(boardPublicId: String): List<Comment> {
        // Public ID → Internal PK 변환
        val board = boardRepository.findByPublicId(boardPublicId)
        return commentRepository.findByBoardId(board.id!!)
    }

    /**
     * 특정 게시글의 모든 댓글 조회 (Public IDs 포함)
     */
    @Transactional(readOnly = true)
    fun getCommentsByBoardPublicIdWithPublicIds(boardPublicId: String): List<CommentWithPublicIds> {
        // Public ID → Internal PK 변환
        val board = boardRepository.findByPublicId(boardPublicId)
        val comments = commentRepository.findByBoardId(board.id!!)

        if (comments.isEmpty()) return emptyList()

        // Batch 조회로 N+1 방지
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

    // ==================== DTO 반환 메서드 ====================

    /**
     * 댓글 작성 (DTO 반환)
     */
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

    /**
     * 댓글 수정 (DTO 반환)
     */
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

    /**
     * Comment + Public IDs
     */
    data class CommentWithPublicIds(
        val comment: Comment,
        val boardPublicId: String,
        val authorPublicId: String,
        val parentPublicId: String?
    )

    /**
     * 댓글 수정
     */
    @Transactional
    fun update(publicId: String, request: CommentUpdateRequest, userPublicId: String): Comment {
        val comment = commentRepository.findByPublicId(publicId)

        // Public ID → Internal PK 변환
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")

        // 작성자 확인
        if (comment.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 댓글만 수정할 수 있습니다")
        }

        val updatedComment = comment.update(request.content)
        return commentRepository.update(updatedComment)
    }

    /**
     * 댓글 삭제 (하드 삭제)
     */
    @Transactional
    fun delete(publicId: String, userPublicId: String) {
        val comment = commentRepository.findByPublicId(publicId)

        // Public ID → Internal PK 변환
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")

        // 작성자 확인
        if (comment.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 댓글만 삭제할 수 있습니다")
        }

        commentRepository.delete(comment.id!!)
    }
}
