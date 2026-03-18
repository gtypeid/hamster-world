package com.hamsterworld.ecommerce.domain.board.model
import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import jakarta.persistence.*
@Entity
@Table(
    name = "boards",
    indexes = [
        Index(name = "idx_board_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_board_product_category", columnList = "product_id, category"),
        Index(name = "idx_board_author", columnList = "author_id"),
        Index(name = "idx_board_created_at", columnList = "created_at")
    ]
)
class Board(
    @Column(nullable = false, name = "product_id")
    var productId: Long = 0,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var category: BoardCategory = BoardCategory.REVIEW,
    @Column(nullable = false, name = "author_id")
    var authorId: Long = 0,
    @Column(nullable = false, length = 100, name = "author_name")
    var authorName: String = "",
    @Column(nullable = false, length = 200)
    var title: String = "",
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",
    @Column(nullable = true)
    var rating: Int? = null
) : AbsDomain() {
    fun update(
        title: String,
        content: String,
        rating: Int? = null
    ): Board {
        if (rating != null) {
            require(rating in 1..5) { "별점은 1-5 사이여야 합니다." }
        }
        this.title = title
        this.content = content
        this.rating = rating
        return this
    }
    fun isReview(): Boolean = category == BoardCategory.REVIEW
    fun isInquiry(): Boolean = category == BoardCategory.INQUIRY
}
