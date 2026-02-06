DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
                         `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                         `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                         `user_id` BIGINT(20) NOT NULL COMMENT '사용자 ID',
                         `name` VARCHAR(100) NULL COMMENT '장바구니 이름 (기본값: default)',
                         `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                         `modified_at` DATETIME NULL COMMENT '수정 일시',
                         PRIMARY KEY (`id`) USING BTREE,
                         UNIQUE KEY `idx_carts_public_id` (`public_id`) USING BTREE,
                         KEY `idx_carts_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;