package com.hamsterworld.ecommerce.app.board.controller

import com.hamsterworld.ecommerce.app.board.request.BoardCreateRequest
import com.hamsterworld.ecommerce.app.board.request.BoardUpdateRequest
import com.hamsterworld.ecommerce.app.board.response.BoardResponse
import com.hamsterworld.ecommerce.app.comment.request.CommentCreateRequest
import com.hamsterworld.ecommerce.app.comment.request.CommentUpdateRequest
import com.hamsterworld.ecommerce.app.comment.response.CommentResponse
import com.hamsterworld.ecommerce.domain.board.service.BoardService
import com.hamsterworld.ecommerce.domain.comment.service.CommentService
import com.hamsterworld.ecommerce.domain.user.model.User
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

/**
 * Board API (리뷰, 문의) - Protected (JWT 필수)
 *
 * ## 책임
 * - 게시글 CUD (생성, 수정, 삭제)
 * - 댓글 CUD (생성, 수정, 삭제)
 * - 조회는 BoardPublicController 사용 (/api/public/boards)
 *
 * ## 엔드포인트
 * - POST   /api/boards                                  → 게시글 작성
 * - PUT    /api/boards/{boardId}                        → 게시글 수정
 * - DELETE /api/boards/{boardId}                        → 게시글 삭제
 * - POST   /api/boards/{boardId}/comments               → 댓글 작성
 * - PUT    /api/boards/{boardId}/comments/{commentId}   → 댓글 수정
 * - DELETE /api/boards/{boardId}/comments/{commentId}   → 댓글 삭제
 */
@RestController
@RequestMapping("/api/boards")
@Tag(name = "게시판 (Protected)", description = "리뷰/문의 게시판 Protected API")
class BoardController(
    private val boardService: BoardService,
    private val commentService: CommentService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(summary = "게시글 작성", description = "리뷰 또는 문의를 작성합니다")
    @PostMapping
    fun createBoard(
        @RequestBody @Valid request: BoardCreateRequest,
        @AuthenticationPrincipal user: User?
    ): ResponseEntity<BoardResponse> {
        log.info("Creating board - user object: {}", user)

        if (user == null) {
            log.error("User is null! Authentication failed or JWT not provided")
            throw IllegalStateException("인증이 필요합니다")
        }

        log.info(
            "Creating board: productPublicId={}, category={}, author={}",
            request.productPublicId, request.category, user.publicId
        )

        val board = boardService.create(request, user.publicId, user.name)

        // 생성된 Board의 productId, authorId로 Public ID 조회
        val boardWithIds = boardService.getByPublicIdWithPublicIds(board.publicId)
        val response = BoardResponse.from(boardWithIds.board, boardWithIds.productPublicId, boardWithIds.authorPublicId, boardWithIds.commentCount)

        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @Operation(summary = "게시글 수정", description = "본인이 작성한 게시글을 수정합니다")
    @PutMapping("/{publicId}")
    fun updateBoard(
        @PathVariable publicId: String,
        @RequestBody @Valid request: BoardUpdateRequest,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<BoardResponse> {
        log.info("Updating board: publicId={}, author={}", publicId, user.publicId)

        val board = boardService.update(publicId, request, user.publicId)

        // 수정된 Board의 productId, authorId로 Public ID 조회
        val boardWithIds = boardService.getByPublicIdWithPublicIds(board.publicId)
        val response = BoardResponse.from(boardWithIds.board, boardWithIds.productPublicId, boardWithIds.authorPublicId, boardWithIds.commentCount)

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "게시글 삭제", description = "본인이 작성한 게시글을 삭제합니다")
    @DeleteMapping("/{publicId}")
    fun deleteBoard(
        @PathVariable publicId: String,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Void> {
        log.info("Deleting board: publicId={}, author={}", publicId, user.publicId)

        boardService.delete(publicId, user.publicId)

        return ResponseEntity.noContent().build()
    }

    // ==================== 댓글 API ====================

    @Operation(summary = "댓글 작성", description = "게시글에 댓글을 작성합니다")
    @PostMapping("/{boardPublicId}/comments")
    fun createComment(
        @PathVariable boardPublicId: String,
        @RequestBody @Valid request: CommentCreateRequest,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<CommentResponse> {
        log.info(
            "Creating comment: boardPublicId={}, author={}",
            boardPublicId, user.publicId
        )

        val comment = commentService.create(boardPublicId, request, user.publicId, user.name)
        val commentWithIds = commentService.getByPublicIdWithPublicIds(comment.publicId)
        val response = CommentResponse.from(
            commentWithIds.comment,
            commentWithIds.boardPublicId,
            commentWithIds.authorPublicId,
            commentWithIds.parentPublicId
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

    @Operation(summary = "댓글 수정", description = "본인이 작성한 댓글을 수정합니다")
    @PutMapping("/{boardPublicId}/comments/{commentPublicId}")
    fun updateComment(
        @PathVariable boardPublicId: String,
        @PathVariable commentPublicId: String,
        @RequestBody @Valid request: CommentUpdateRequest,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<CommentResponse> {
        log.info("Updating comment: boardPublicId={}, commentPublicId={}, author={}", boardPublicId, commentPublicId, user.publicId)

        val comment = commentService.update(commentPublicId, request, user.publicId)
        val commentWithIds = commentService.getByPublicIdWithPublicIds(comment.publicId)
        val response = CommentResponse.from(
            commentWithIds.comment,
            commentWithIds.boardPublicId,
            commentWithIds.authorPublicId,
            commentWithIds.parentPublicId
        )

        return ResponseEntity.ok(response)
    }

    @Operation(summary = "댓글 삭제", description = "본인이 작성한 댓글을 삭제합니다")
    @DeleteMapping("/{boardPublicId}/comments/{commentPublicId}")
    fun deleteComment(
        @PathVariable boardPublicId: String,
        @PathVariable commentPublicId: String,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Void> {
        log.info("Deleting comment: boardPublicId={}, commentPublicId={}, author={}", boardPublicId, commentPublicId, user.publicId)

        commentService.delete(commentPublicId, user.publicId)

        return ResponseEntity.noContent().build()
    }
}
