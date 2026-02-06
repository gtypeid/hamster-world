
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `target_type` VARCHAR(40) NOT NULL,
    `target_id` BIGINT(20) NOT NULL,
    `path` VARCHAR(200) NOT NULL,
    `name` VARCHAR(200) NULL,
    `created_at` datetime NOT NULL,
    `modified_at` datetime NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_attachments_public_id` (`public_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
