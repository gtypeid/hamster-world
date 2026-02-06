package com.hamsterworld.ecommerce.domain.board.constant

/**
 * 게시판 카테고리
 *
 * 상품에 대한 게시글의 종류를 구분
 */
enum class BoardCategory {
    /**
     * 리뷰 (상품평)
     * - 별점(rating) 포함
     * - 구매자가 작성
     */
    REVIEW,

    /**
     * 문의 (Q&A)
     * - 구매자 질문
     * - 판매자 답변 (Comment로 처리)
     */
    INQUIRY
}
