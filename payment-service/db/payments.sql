DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `process_public_id` VARCHAR(20) NOT NULL COMMENT 'Cash Gateway PaymentProcess Public ID',
    `gateway_payment_public_id` VARCHAR(20) NOT NULL COMMENT 'Cash Gateway Payment Public ID (방화벽 원천)',
    `gateway_mid` VARCHAR(100) NOT NULL COMMENT 'Cash Gateway MID (어느 채널로 처리되었는지)',
    `order_public_id` VARCHAR(20) NOT NULL COMMENT 'Ecommerce Order Public ID',
    `order_snapshot_id` BIGINT(20) NOT NULL COMMENT 'OrderSnapshot FK (내부 트랜잭션)',
    `amount` DECIMAL(15, 3) NOT NULL COMMENT '결제 금액',
    `status` VARCHAR(20) NOT NULL COMMENT '결제 상태 (APPROVED, CANCELLED)',
    `pg_transaction` VARCHAR(255) DEFAULT NULL COMMENT 'PG 거래번호 (참고용, 추적용)',
    `pg_approval_no` VARCHAR(255) DEFAULT NULL COMMENT 'PG 승인번호 (참고용)',
    `origin_payment_id` BIGINT(20) DEFAULT NULL COMMENT '원본 결제 ID (취소건인 경우)',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_payments_public_id` (`public_id`) USING BTREE,
    KEY `idx_payments_process_public_id` (`process_public_id`),
    KEY `idx_payments_gateway_payment_public_id` (`gateway_payment_public_id`),
    KEY `idx_payments_order_public_id` (`order_public_id`),
    KEY `idx_payments_order_snapshot_id` (`order_snapshot_id`),
    UNIQUE KEY `idx_payments_pg_transaction` (`pg_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='결제 기록 (Business Truth - Payment Service 소유)';
