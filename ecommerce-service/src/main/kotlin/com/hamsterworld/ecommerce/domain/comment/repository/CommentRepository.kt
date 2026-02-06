package com.hamsterworld.ecommerce.domain.comment.repository

import com.hamsterworld.common.web.QuerydslExtension.applySorts
import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.hamsterworld.ecommerce.domain.comment.model.Comment
import com.hamsterworld.ecommerce.domain.comment.model.QComment.comment
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Repository
import com.hamsterworld.common.app.SortDirection

@Repository
class CommentRepository(
    private val commentJpaRepository: CommentJpaRepository,
    private val jpaQueryFactory: JPAQueryFactory
) {

    fun save(comment: Comment): Comment {
        return commentJpaRepository.save(comment)
    }

    fun update(comment: Comment): Comment {
        return commentJpaRepository.save(comment)
    }

    fun findById(id: Long): Comment {
        return commentJpaRepository.findById(id)
            .orElseThrow { CustomRuntimeException("댓글을 찾을 수 없습니다. ID: $id") }
    }

    fun findByPublicId(publicId: String): Comment {
        return commentJpaRepository.findByPublicId(publicId)
            .orElseThrow { CustomRuntimeException("댓글을 찾을 수 없습니다. Public ID: $publicId") }
    }

    fun findByIds(ids: List<Long>): List<Comment> {
        if (ids.isEmpty()) return emptyList()
        return jpaQueryFactory
            .selectFrom(comment)
            .where(comment.id.`in`(ids))
            .fetch()
    }

    /**
     * 특정 게시글의 모든 댓글 조회 (계층 구조 포함)
     */
    fun findByBoardId(boardId: Long): List<Comment> {
        val query = jpaQueryFactory.selectFrom(comment)
            .where(comment.boardId.eq(boardId))

        // 생성일시 오름차순 정렬 (오래된 댓글부터)
        return applySorts(query, comment.createdAt, SortDirection.ASC).fetch()
    }

    /**
     * 특정 게시글의 댓글 개수 조회
     */
    fun countByBoardId(boardId: Long): Int {
        return jpaQueryFactory
            .select(comment.count())
            .from(comment)
            .where(comment.boardId.eq(boardId))
            .fetchOne()?.toInt() ?: 0
    }

    /**
     * 여러 게시글의 댓글 개수 Batch 조회
     */
    fun countByBoardIds(boardIds: List<Long>): Map<Long, Int> {
        if (boardIds.isEmpty()) return emptyMap()

        val results = jpaQueryFactory
            .select(comment.boardId, comment.count())
            .from(comment)
            .where(comment.boardId.`in`(boardIds))
            .groupBy(comment.boardId)
            .fetch()

        return results.associate { it.get(comment.boardId)!! to it.get(comment.count())!!.toInt() }
    }

    /**
     * 특정 게시글의 최상위 댓글만 조회
     */
    fun findRootCommentsByBoardId(boardId: Long): List<Comment> {
        return jpaQueryFactory.selectFrom(comment)
            .where(
                comment.boardId.eq(boardId),
                comment.parentId.isNull
            )
            .orderBy(comment.createdAt.asc())
            .fetch()
    }

    /**
     * 특정 댓글의 대댓글 조회
     */
    fun findRepliesByParentId(parentId: Long): List<Comment> {
        return jpaQueryFactory.selectFrom(comment)
            .where(comment.parentId.eq(parentId))
            .orderBy(comment.createdAt.asc())
            .fetch()
    }

    fun delete(id: Long) {
        commentJpaRepository.deleteById(id)
    }
}
