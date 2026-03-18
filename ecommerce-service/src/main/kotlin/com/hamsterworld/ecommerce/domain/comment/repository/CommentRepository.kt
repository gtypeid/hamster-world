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
    fun findByBoardId(boardId: Long): List<Comment> {
        val query = jpaQueryFactory.selectFrom(comment)
            .where(comment.boardId.eq(boardId))
        return applySorts(query, comment.createdAt, SortDirection.ASC).fetch()
    }
    fun countByBoardId(boardId: Long): Int {
        return jpaQueryFactory
            .select(comment.count())
            .from(comment)
            .where(comment.boardId.eq(boardId))
            .fetchOne()?.toInt() ?: 0
    }
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
    fun findRootCommentsByBoardId(boardId: Long): List<Comment> {
        return jpaQueryFactory.selectFrom(comment)
            .where(
                comment.boardId.eq(boardId),
                comment.parentId.isNull
            )
            .orderBy(comment.createdAt.asc())
            .fetch()
    }
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
