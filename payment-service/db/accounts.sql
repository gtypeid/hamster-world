DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_public_id` VARCHAR(20) NOT NULL COMMENT 'User Public ID (Snowflake Base62)',
    `account_type` VARCHAR(20) NOT NULL COMMENT '계좌 유형 (CONSUMER, SELLER 등)',
    `balance` DECIMAL(15, 3) NOT NULL DEFAULT 0.000 COMMENT '현재 잔액 (AccountRecord 합산으로 재계산 가능)',
    `last_recorded_at` DATETIME NULL COMMENT '마지막 재집계 시점',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NULL COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_accounts_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_accounts_user_account_type` (`user_public_id`, `account_type`),
    KEY `idx_accounts_user_public_id` (`user_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='내부 계좌 (Event Sourcing 기반, Product 패턴과 동일)';
