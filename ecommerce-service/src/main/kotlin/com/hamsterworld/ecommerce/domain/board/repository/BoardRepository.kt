package com.hamsterworld.ecommerce.domain.board.repository

import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.QuerydslExtension.between
import com.hamsterworld.common.web.QuerydslExtension.eqOrNull
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.app.board.request.BoardSearchRequest
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import com.hamsterworld.ecommerce.domain.board.model.Board
import com.hamsterworld.ecommerce.domain.board.model.QBoard.board
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Repository

@Repository
class BoardRepository(
    private val boardJpaRepository: BoardJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory,
    private val productRepository: com.hamsterworld.ecommerce.domain.product.repository.ProductRepository,
    private val userRepository: com.hamsterworld.ecommerce.domain.user.repository.UserRepository
) {

    fun save(board: Board): Board {
        return boardJpaRepository.save(board)
    }

    fun update(board: Board): Board {
        return boardJpaRepository.save(board)
    }

    fun findById(id: Long): Board {
        return boardJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("게시글을 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): Board {
        return boardJpaRepository.findByPublicId(publicId)
            .orElseThrow { CustomRuntimeException("게시글을 찾을 수 없습니다. Public ID: $publicId") }
    }

    fun searchList(request: BoardSearchRequest): List<Board> {
        val baseQuery = baseQuery(request)

        return applySorts(baseQuery, board.createdAt, request.sort)
            .fetch()
    }

    fun searchPage(request: BoardSearchRequest): Page<Board> {
        val baseQuery = baseQuery(request)

        // Count query
        val total = jpaQueryFactory
            .select(board.count())
            .from(board)
            .where(*searchConditions(request).toTypedArray())
            .fetchOne() ?: 0L

        val pagedQuery = baseQuery
            .offset((request.page * request.size).toLong())
            .limit(request.size.toLong())

        val entities = applySorts(pagedQuery, board.createdAt, request.sort)
            .fetch()

        return PageImpl(entities, PageRequest.of(request.page, request.size), total)
    }

    private fun baseQuery(request: BoardSearchRequest): com.querydsl.jpa.impl.JPAQuery<Board> {
        return jpaQueryFactory
            .selectFrom(board)
            .where(*searchConditions(request).toTypedArray())
    }

    fun delete(id: Long) {
        boardJpaRepository.deleteById(id)
    }

    /**
     * 여러 상품의 리뷰 통계 Batch 조회 (평균 평점 + 리뷰 개수)
     */
    fun getReviewStatsByProductIds(productIds: List<Long>): Map<Long, ReviewStats> {
        if (productIds.isEmpty()) return emptyMap()

        val results = jpaQueryFactory
            .select(
                board.productId,
                board.rating.avg().coalesce(0.0),
                board.count()
            )
            .from(board)
            .where(
                board.productId.`in`(productIds),
                board.category.eq(BoardCategory.REVIEW),
                board.rating.isNotNull
            )
            .groupBy(board.productId)
            .fetch()

        return results.associate {
            it.get(board.productId)!! to ReviewStats(
                averageRating = it.get(board.rating.avg().coalesce(0.0))!!,
                reviewCount = it.get(board.count())!!.toInt()
            )
        }
    }

    data class ReviewStats(
        val averageRating: Double,
        val reviewCount: Int
    )

    private fun searchConditions(search: BoardSearchRequest): List<BooleanExpression> {
        // Public ID → Internal PK 변환
        val product = productRepository.findByPublicId(search.productPublicId)
        val authorId: Long? = search.authorPublicId?.let { authorPublicId ->
            userRepository.findByPublicId(authorPublicId).id
        }

        return listOfNotNull(
            board.productId.eq(product.id!!),
            eqOrNull(board.category, search.category),
            between(board.createdAt, search.from, search.to),
            eqOrNull(board.authorId, authorId)
        )
    }
}
