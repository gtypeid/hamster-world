DROP TABLE IF EXISTS `account_records`;
CREATE TABLE `account_records` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `account_id` BIGINT(20) NOT NULL COMMENT '참조된 계좌 ID',
    `amount` DECIMAL(15, 3) NOT NULL COMMENT '변동 금액 (+적립, -사용, +환불)',
    `reason` VARCHAR(255) NOT NULL COMMENT '변경 사유 (ex. 포인트 적립, 주문 포인트 사용, 결제 취소 환원)',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NULL COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_account_records_public_id` (`public_id`) USING BTREE,
    KEY `idx_account_records_account_id` (`account_id`),
    CONSTRAINT `fk_account_records_account_id`
        FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='계좌 변동 이력 (Event Sourcing - delta만 저장, 합산 = 잔액)';
