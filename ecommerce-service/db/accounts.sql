-- Ecommerce Service: Account 테이블
-- Payment Service의 Account 잔액을 동기화받는 Read Model (캐시)
-- 진실의 원천(Source of Truth)은 Payment Service

DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
    `id`               BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`        VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id`          BIGINT(20)     NOT NULL COMMENT 'User ID (1:1 매핑)',
    `consumer_balance` DECIMAL(15, 3) NOT NULL DEFAULT 0.000 COMMENT '컨슈머 포인트 (Payment Service에서 동기화)',
    `merchant_balance` DECIMAL(15, 3) NOT NULL DEFAULT 0.000 COMMENT '머천트 정산금 (Payment Service에서 동기화)',
    `rider_balance`    DECIMAL(15, 3) NOT NULL DEFAULT 0.000 COMMENT '라이더 정산금 (Payment Service에서 동기화)',
    `last_synced_at`   DATETIME       NULL COMMENT '마지막 잔액 동기화 시각',
    `created_at`       DATETIME       NOT NULL,
    `modified_at`      DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_accounts_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_accounts_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='계좌 (Read Model, Payment Service에서 잔액 동기화)';
