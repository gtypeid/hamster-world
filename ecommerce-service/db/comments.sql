-- Ecommerce Service: Comment 테이블
-- 게시글에 대한 댓글 및 대댓글

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
    `id`          BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`   VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `board_id`    BIGINT(20)   NOT NULL COMMENT 'Board ID (Internal PK)',
    `author_id`   BIGINT(20)   NOT NULL COMMENT 'Author ID (Internal PK)',
    `author_name` VARCHAR(100) NOT NULL COMMENT 'Author Name (비정규화)',
    `content`     TEXT         NOT NULL COMMENT 'Comment Content',
    `parent_id`   BIGINT(20)   NULL COMMENT 'Parent Comment ID (NULL for root comments)',
    `is_seller`   BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'Seller Reply Flag',
    `created_at`  DATETIME     NOT NULL,
    `modified_at` DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_comment_public_id` (`public_id`) USING BTREE,
    KEY `idx_comment_board` (`board_id`) USING BTREE,
    KEY `idx_comment_parent` (`parent_id`) USING BTREE,
    KEY `idx_comment_author` (`author_id`) USING BTREE,
    KEY `idx_comment_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='댓글';
