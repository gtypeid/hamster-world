package com.hamsterworld.ecommerce.domain.board.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.ecommerce.domain.board.constant.BoardCategory
import jakarta.persistence.*

/**
 * 상품 게시판 (리뷰, 문의)
 *
 * 상품에 대한 리뷰나 문의를 작성하는 게시판
 * - 관계형 매핑 없이 QueryDSL로 조회
 * - productPublicId로 상품과 연결
 */
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
    /**
     * 상품 ID (어떤 상품에 대한 게시글인지)
     * - Product와 관계형 매핑 없이 Internal PK로 연결
     */
    @Column(nullable = false, name = "product_id")
    var productId: Long = 0,

    /**
     * 게시판 카테고리 (리뷰 or 문의)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var category: BoardCategory = BoardCategory.REVIEW,

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
     * 제목
     */
    @Column(nullable = false, length = 200)
    var title: String = "",

    /**
     * 내용
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    /**
     * 별점 (1-5)
     * - REVIEW 카테고리일 때만 사용
     * - INQUIRY일 때는 null
     */
    @Column(nullable = true)
    var rating: Int? = null
) : AbsDomain() {

    /**
     * 게시글 수정
     * - 자기 자신의 필드를 수정하고 자신을 반환
     * - JPA 변경 감지로 자동 저장됨
     */
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

    /**
     * 리뷰인지 확인
     */
    fun isReview(): Boolean = category == BoardCategory.REVIEW

    /**
     * 문의인지 확인
     */
    fun isInquiry(): Boolean = category == BoardCategory.INQUIRY
}
