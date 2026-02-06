-- Boards 테이블 (게시판: 리뷰/문의)
-- 상품에 대한 리뷰 및 문의 게시글

CREATE TABLE `boards` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',

    -- 상품 정보
    `product_id` BIGINT(20) NOT NULL COMMENT 'Product ID (Internal PK)',

    -- 게시판 분류
    `category` VARCHAR(50) NOT NULL COMMENT 'Board Category (REVIEW, INQUIRY)',

    -- 작성자 정보
    `author_id` BIGINT(20) NOT NULL COMMENT 'Author ID (Internal PK)',
    `author_name` VARCHAR(100) NOT NULL COMMENT 'Author Name (비정규화)',

    -- 게시글 내용
    `title` VARCHAR(200) NOT NULL COMMENT 'Title',
    `content` TEXT NOT NULL COMMENT 'Content',

    -- 리뷰 전용
    `rating` INT NULL COMMENT 'Rating (1-5, REVIEW only)',

    -- 공통 필드
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
    `modified_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시',

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_board_public_id` (`public_id`) USING BTREE,
    KEY `idx_board_product_category` (`product_id`, `category`) USING BTREE,
    KEY `idx_board_author` (`author_id`) USING BTREE,
    KEY `idx_board_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 (리뷰/문의)';
