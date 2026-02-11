package com.hamsterworld.ecommerce.app.board.controller

import com.hamsterworld.ecommerce.app.board.request.BoardSearchRequest
import com.hamsterworld.ecommerce.app.board.response.BoardResponse
import com.hamsterworld.ecommerce.app.board.response.BoardWithCommentsResponse
import com.hamsterworld.ecommerce.domain.board.service.BoardService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * Board Public API (비로그인 사용자 접근 가능)
 *
 * ## 책임
 * - 게시글 조회 (리뷰, 문의)
 * - JWT 인증 불필요 (Public API)
 *
 * ## 엔드포인트
 * - GET /api/public/boards/list                    → 게시글 목록 조회
 * - GET /api/public/boards/page                    → 게시글 페이지 조회
 * - GET /api/public/boards/{boardId}               → 게시글 단건 조회 (댓글 포함)
 */
@RestController
@RequestMapping("/api/public/boards")
@Tag(name = "게시판 (Public)", description = "리뷰/문의 게시판 Public API")
class BoardPublicController(
    private val boardService: BoardService
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(summary = "게시글 목록 조회", description = "상품의 리뷰/문의 목록을 조회합니다")
    @GetMapping("/list")
    fun searchBoardsList(
        @ModelAttribute search: BoardSearchRequest
    ): ResponseEntity<List<BoardResponse>> {
        log.info(
            "Searching boards (list): productPublicId={}, category={}",
            search.productPublicId, search.category
        )

        val responses = boardService.searchListAsDto(search)

        log.info("Found {} boards", responses.size)

        return ResponseEntity.ok(responses)
    }

    @Operation(summary = "게시글 페이지 조회", description = "상품의 리뷰/문의 목록을 페이징하여 조회합니다")
    @GetMapping("/page")
    fun searchBoardsPage(
        @ModelAttribute search: BoardSearchRequest
    ): ResponseEntity<Page<BoardResponse>> {
        log.info(
            "Searching boards (page): productPublicId={}, category={}, page={}, size={}",
            search.productPublicId, search.category, search.page, search.size
        )

        val responses = boardService.searchPageAsDto(search)

        log.info("Found {} boards (page {}/{})", responses.totalElements, responses.number, responses.totalPages)

        return ResponseEntity.ok(responses)
    }

    @Operation(summary = "게시글 단건 조회", description = "게시글과 댓글을 함께 조회합니다")
    @GetMapping("/{publicId}")
    fun getBoard(
        @PathVariable publicId: String
    ): ResponseEntity<BoardWithCommentsResponse> {
        log.info("Getting board: publicId={}", publicId)

        return ResponseEntity.ok(boardService.getBoardWithCommentsAsDto(publicId))
    }
}
