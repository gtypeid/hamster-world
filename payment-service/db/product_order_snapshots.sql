DROP TABLE IF EXISTS `product_order_snapshots`;
CREATE TABLE `product_order_snapshots` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `order_public_id` VARCHAR(20) NOT NULL COMMENT 'E-commerce Service의 Order Public ID (Snowflake Base62)',
    `order_number` VARCHAR(255) NOT NULL COMMENT '주문 번호',
    `user_public_id` VARCHAR(20) NOT NULL COMMENT 'E-commerce Service의 User Public ID (Snowflake Base62)',
    `total_price` DECIMAL(15, 3) NOT NULL COMMENT '총 주문 금액',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_order_public_id` (`order_public_id`) USING BTREE,
    KEY `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주문 스냅샷 (결제 취소 시 재고 복원용)';
