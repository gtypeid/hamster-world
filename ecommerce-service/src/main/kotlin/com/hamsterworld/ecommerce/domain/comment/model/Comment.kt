package com.hamsterworld.ecommerce.domain.comment.model
import com.hamsterworld.common.domain.abs.AbsDomain
import jakarta.persistence.*
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
    @Column(nullable = false, name = "board_id")
    var boardId: Long = 0,
    @Column(nullable = false, name = "author_id")
    var authorId: Long = 0,
    @Column(nullable = false, length = 100, name = "author_name")
    var authorName: String = "",
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",
    @Column(nullable = true, name = "parent_id")
    var parentId: Long? = null,
    @Column(nullable = false, name = "is_seller")
    var isSeller: Boolean = false
) : AbsDomain() {
    fun update(content: String): Comment {
        this.content = content
        return this
    }
    fun isRootComment(): Boolean = parentId == null
    fun isReply(): Boolean = parentId != null
}
