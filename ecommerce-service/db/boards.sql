-- Ecommerce Service: Board 테이블
-- 게시판 (리뷰/문의)

DROP TABLE IF EXISTS `boards`;
CREATE TABLE `boards` (
    `id`          BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`   VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `product_id`  BIGINT(20)   NOT NULL COMMENT 'Product ID (Internal PK)',
    `category`    VARCHAR(50)  NOT NULL COMMENT 'Board Category (REVIEW, INQUIRY)',
    `author_id`   BIGINT(20)   NOT NULL COMMENT 'Author ID (Internal PK)',
    `author_name` VARCHAR(100) NOT NULL COMMENT 'Author Name (비정규화)',
    `title`       VARCHAR(200) NOT NULL COMMENT 'Title',
    `content`     TEXT         NOT NULL COMMENT 'Content',
    `rating`      INT          NULL COMMENT 'Rating (1-5, REVIEW only)',
    `created_at`  DATETIME     NOT NULL,
    `modified_at` DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_board_public_id` (`public_id`) USING BTREE,
    KEY `idx_board_product_category` (`product_id`, `category`) USING BTREE,
    KEY `idx_board_author` (`author_id`) USING BTREE,
    KEY `idx_board_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='게시판 (리뷰/문의)';
