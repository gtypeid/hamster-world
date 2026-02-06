-- Comments 테이블 (댓글)
-- 게시글에 대한 댓글 및 대댓글

CREATE TABLE `comments` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',

    -- 게시글 정보
    `board_id` BIGINT(20) NOT NULL COMMENT 'Board ID (Internal PK)',

    -- 작성자 정보
    `author_id` BIGINT(20) NOT NULL COMMENT 'Author ID (Internal PK)',
    `author_name` VARCHAR(100) NOT NULL COMMENT 'Author Name (비정규화)',

    -- 댓글 내용
    `content` TEXT NOT NULL COMMENT 'Comment Content',

    -- 대댓글 정보
    `parent_id` BIGINT(20) NULL COMMENT 'Parent Comment ID (NULL for root comments)',

    -- 판매자 답변 여부
    `is_seller` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Seller Reply Flag',

    -- 공통 필드
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
    `modified_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시',

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_comment_public_id` (`public_id`) USING BTREE,
    KEY `idx_comment_board` (`board_id`) USING BTREE,
    KEY `idx_comment_parent` (`parent_id`) USING BTREE,
    KEY `idx_comment_author` (`author_id`) USING BTREE,
    KEY `idx_comment_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='댓글';
