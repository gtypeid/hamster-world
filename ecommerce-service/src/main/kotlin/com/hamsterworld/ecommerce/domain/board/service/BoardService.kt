package com.hamsterworld.ecommerce.domain.board.service

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.board.request.BoardCreateRequest
import com.hamsterworld.ecommerce.app.board.request.BoardSearchRequest
import com.hamsterworld.ecommerce.app.board.request.BoardUpdateRequest
import com.hamsterworld.ecommerce.app.board.response.BoardResponse
import com.hamsterworld.ecommerce.app.board.response.BoardWithCommentsResponse
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import com.hamsterworld.ecommerce.domain.board.model.Board
import com.hamsterworld.ecommerce.domain.board.repository.BoardRepository
import com.hamsterworld.ecommerce.domain.product.repository.ProductRepository
import com.hamsterworld.ecommerce.domain.user.repository.UserRepository
import com.hamsterworld.ecommerce.domain.comment.repository.CommentRepository
import com.hamsterworld.ecommerce.domain.comment.service.CommentService
import org.springframework.data.domain.Page
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BoardService(
    private val boardRepository: BoardRepository,
    private val productRepository: ProductRepository,
    private val userRepository: UserRepository,
    private val commentRepository: CommentRepository
) {

    /**
     * 게시글 작성
     */
    @Transactional
    fun create(request: BoardCreateRequest, authorPublicId: String, authorName: String): Board {
        // 리뷰는 별점 필수
        if (request.category == BoardCategory.REVIEW && request.rating == null) {
            throw CustomRuntimeException("리뷰는 별점이 필수입니다")
        }

        // 문의는 별점 불가
        if (request.category == BoardCategory.INQUIRY && request.rating != null) {
            throw CustomRuntimeException("문의에는 별점을 사용할 수 없습니다")
        }

        // Public ID → Internal PK 변환
        val product = productRepository.findByPublicId(request.productPublicId)
        val author = userRepository.findByPublicId(authorPublicId)

        val board = Board(
            productId = product.id!!,
            category = request.category,
            authorId = author.id!!,
            authorName = authorName,
            title = request.title,
            content = request.content,
            rating = request.rating
        )

        return boardRepository.save(board)
    }

    /**
     * 게시글 조회 (Public ID)
     */
    @Transactional(readOnly = true)
    fun getByPublicId(publicId: String): Board {
        return boardRepository.findByPublicId(publicId)
    }

    /**
     * 게시글 조회 (Public ID) + Product/Author Public IDs + Comment Count
     */
    @Transactional(readOnly = true)
    fun getByPublicIdWithPublicIds(publicId: String): BoardWithPublicIds {
        val board = boardRepository.findByPublicId(publicId)
        val product = productRepository.findById(board.productId)
        val user = userRepository.findById(board.authorId)
        val commentCount = commentRepository.countByBoardId(board.id!!)

        return BoardWithPublicIds(
            board = board,
            productPublicId = product.publicId,
            authorPublicId = user.publicId,
            commentCount = commentCount
        )
    }

    /**
     * 게시글 검색 (리스트)
     * Board + Product Public ID + Author Public ID + Comment Count 함께 반환
     */
    @Transactional(readOnly = true)
    fun searchList(request: BoardSearchRequest): List<BoardWithPublicIds> {
        val boards = boardRepository.searchList(request)

        // Batch 조회로 N+1 방지
        val boardIds = boards.map { it.id!! }.distinct()
        val productIds = boards.map { it.productId }.distinct()
        val authorIds = boards.map { it.authorId }.distinct()

        val products = productRepository.findByIds(productIds).associateBy { it.id!! }
        val users = userRepository.findByIds(authorIds).associateBy { it.id!! }
        val commentCounts = commentRepository.countByBoardIds(boardIds)

        return boards.map { board ->
            val product = products[board.productId]
                ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${board.productId}")
            val user = users[board.authorId]
                ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${board.authorId}")

            BoardWithPublicIds(
                board = board,
                productPublicId = product.publicId,
                authorPublicId = user.publicId,
                commentCount = commentCounts[board.id] ?: 0
            )
        }
    }

    /**
     * 게시글 검색 (페이징)
     * Board + Product Public ID + Author Public ID + Comment Count 함께 반환
     */
    @Transactional(readOnly = true)
    fun searchPage(request: BoardSearchRequest): Page<BoardWithPublicIds> {
        val boardsPage = boardRepository.searchPage(request)

        // Batch 조회로 N+1 방지
        val boardIds = boardsPage.content.map { it.id!! }.distinct()
        val productIds = boardsPage.content.map { it.productId }.distinct()
        val authorIds = boardsPage.content.map { it.authorId }.distinct()

        val products = productRepository.findByIds(productIds).associateBy { it.id!! }
        val users = userRepository.findByIds(authorIds).associateBy { it.id!! }
        val commentCounts = commentRepository.countByBoardIds(boardIds)

        return boardsPage.map { board ->
            val product = products[board.productId]
                ?: throw CustomRuntimeException("상품을 찾을 수 없습니다. ID: ${board.productId}")
            val user = users[board.authorId]
                ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${board.authorId}")

            BoardWithPublicIds(
                board = board,
                productPublicId = product.publicId,
                authorPublicId = user.publicId,
                commentCount = commentCounts[board.id] ?: 0
            )
        }
    }

    // ==================== DTO 반환 메서드 ====================

    /**
     * 게시글 작성 (DTO 반환)
     */
    @Transactional
    fun createAndReturnDto(request: BoardCreateRequest, authorPublicId: String, authorName: String): BoardResponse {
        val board = create(request, authorPublicId, authorName)
        val boardWithIds = getByPublicIdWithPublicIds(board.publicId)
        return BoardResponse.from(boardWithIds.board, boardWithIds.productPublicId, boardWithIds.authorPublicId, boardWithIds.commentCount)
    }

    /**
     * 게시글 수정 (DTO 반환)
     */
    @Transactional
    fun updateAndReturnDto(publicId: String, request: BoardUpdateRequest, userPublicId: String): BoardResponse {
        val board = update(publicId, request, userPublicId)
        val boardWithIds = getByPublicIdWithPublicIds(board.publicId)
        return BoardResponse.from(boardWithIds.board, boardWithIds.productPublicId, boardWithIds.authorPublicId, boardWithIds.commentCount)
    }

    /**
     * 게시글 검색 (리스트) - DTO 반환
     */
    @Transactional(readOnly = true)
    fun searchListAsDto(request: BoardSearchRequest): List<BoardResponse> {
        val boards = searchList(request)
        return boards.map { BoardResponse.from(it.board, it.productPublicId, it.authorPublicId, it.commentCount) }
    }

    /**
     * 게시글 검색 (페이징) - DTO 반환
     */
    @Transactional(readOnly = true)
    fun searchPageAsDto(request: BoardSearchRequest): Page<BoardResponse> {
        val boards = searchPage(request)
        return boards.map { BoardResponse.from(it.board, it.productPublicId, it.authorPublicId, it.commentCount) }
    }

    /**
     * 게시글 단건 조회 (댓글 포함) - DTO 반환
     */
    @Transactional(readOnly = true)
    fun getBoardWithCommentsAsDto(publicId: String): BoardWithCommentsResponse {
        val boardWithIds = getByPublicIdWithPublicIds(publicId)
        val commentsWithIds = commentRepository.findByBoardId(boardWithIds.board.id!!)
            .let { comments ->
                if (comments.isEmpty()) return@let emptyList()

                // Batch 조회로 N+1 방지
                val authorIds = comments.map { it.authorId }.distinct()
                val parentIds = comments.mapNotNull { it.parentId }.distinct()

                val authors = userRepository.findByIds(authorIds).associateBy { it.id!! }
                val parentComments = if (parentIds.isNotEmpty()) {
                    commentRepository.findByIds(parentIds).associateBy { it.id!! }
                } else {
                    emptyMap()
                }

                comments.map { comment ->
                    val author = authors[comment.authorId]
                        ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. ID: ${comment.authorId}")
                    val parentPublicId = comment.parentId?.let { parentId ->
                        parentComments[parentId]?.publicId
                    }

                    CommentService.CommentWithPublicIds(
                        comment = comment,
                        boardPublicId = boardWithIds.board.publicId,
                        authorPublicId = author.publicId,
                        parentPublicId = parentPublicId
                    )
                }
            }

        return BoardWithCommentsResponse.from(boardWithIds, commentsWithIds)
    }

    /**
     * Board + Public IDs + Comment Count
     */
    data class BoardWithPublicIds(
        val board: Board,
        val productPublicId: String,
        val authorPublicId: String,
        val commentCount: Int
    )

    /**
     * 게시글 수정
     */
    @Transactional
    fun update(publicId: String, request: BoardUpdateRequest, userPublicId: String): Board {
        val board = boardRepository.findByPublicId(publicId)

        // Public ID → Internal PK 변환
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")

        // 작성자 확인
        if (board.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 게시글만 수정할 수 있습니다")
        }

        // 리뷰는 별점 필수
        if (board.category == BoardCategory.REVIEW && request.rating == null) {
            throw CustomRuntimeException("리뷰는 별점이 필수입니다")
        }

        val updatedBoard = board.update(
            title = request.title,
            content = request.content,
            rating = request.rating
        )

        return boardRepository.update(updatedBoard)
    }

    /**
     * 게시글 삭제 (하드 삭제)
     */
    @Transactional
    fun delete(publicId: String, userPublicId: String) {
        val board = boardRepository.findByPublicId(publicId)

        // Public ID → Internal PK 변환
        val user = userRepository.findByPublicId(userPublicId)
            ?: throw CustomRuntimeException("사용자를 찾을 수 없습니다. User ID: $userPublicId")

        // 작성자 확인
        if (board.authorId != user.id) {
            throw CustomRuntimeException("본인이 작성한 게시글만 삭제할 수 있습니다")
        }

        boardRepository.delete(board.id!!)
    }
}
