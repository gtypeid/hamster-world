package com.hamsterworld.ecommerce.domain.comment.model

import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*

/**
 * 댓글/답글
 *
 * 게시글(Board)에 대한 댓글
 * - 대댓글 지원 (parentPublicId)
 * - 판매자 답변 표시 (isSeller)
 */
@Entity
@Table(
    name = "comments",
    indexes = [
        Index(name = "idx_comment_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_comment_board", columnList = "board_id"),
        Index(name = "idx_comment_parent", columnList = "parent_id"),
        Index(name = "idx_comment_author", columnList = "author_id"),
        Index(name = "idx_comment_created_at", columnList = "created_at")
    ]
)
class Comment(
    /**
     * 게시글 ID (어떤 게시글에 대한 댓글인지)
     * - Board와 관계형 매핑 없이 Internal PK로 연결
     */
    @Column(nullable = false, name = "board_id")
    var boardId: Long = 0,

    /**
     * 작성자 ID
     * - User와 관계형 매핑 없이 Internal PK로 연결
     */
    @Column(nullable = false, name = "author_id")
    var authorId: Long = 0,

    /**
     * 작성자 이름 (비정규화 - 조회 성능)
     */
    @Column(nullable = false, length = 100, name = "author_name")
    var authorName: String = "",

    /**
     * 댓글 내용
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    /**
     * 부모 댓글 ID (대댓글일 경우)
     * - null이면 최상위 댓글
     * - 값이 있으면 대댓글
     */
    @Column(nullable = true, name = "parent_id")
    var parentId: Long? = null,

    /**
     * 판매자 답변 여부
     * - true: 판매자가 작성한 답변
     * - false: 일반 사용자 댓글
     */
    @Column(nullable = false, name = "is_seller")
    var isSeller: Boolean = false
) : AbsDomain() {

    /**
     * 댓글 수정
     * - 자기 자신의 필드를 수정하고 자신을 반환
     * - JPA 변경 감지로 자동 저장됨
     */
    fun update(content: String): Comment {
        this.content = content
        return this
    }

    /**
     * 최상위 댓글인지 확인
     */
    fun isRootComment(): Boolean = parentId == null

    /**
     * 대댓글인지 확인
     */
    fun isReply(): Boolean = parentId != null
}
