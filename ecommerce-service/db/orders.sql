DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
                          `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                          `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                          `user_id` BIGINT(20) NOT NULL COMMENT 'User Internal PK (같은 서비스 내부 FK)',
                          `order_number` VARCHAR(255) DEFAULT NULL COMMENT '고객용 주문번호 (저장 시 자동 생성)',
                          `gateway_payment_public_id` VARCHAR(20) DEFAULT NULL COMMENT 'Cash Gateway Service의 Payment Public ID (Snowflake Base62)',
                          `price` decimal(15, 3) NOT NULL COMMENT '주문 금액',
                          `status` VARCHAR(20) NOT NULL COMMENT '주문 상태',
                          `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                          `modified_at` DATETIME NULL COMMENT '수정 일시',
                          PRIMARY KEY (`id`) USING BTREE,
                          UNIQUE KEY `idx_orders_public_id` (`public_id`) USING BTREE,
                          KEY `idx_orders_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
