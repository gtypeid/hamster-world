DROP TABLE IF EXISTS `product_order_snapshot_items`;
CREATE TABLE `product_order_snapshot_items` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Public ID (Snowflake ID - Base62)',
    `snapshot_id` BIGINT(20) NOT NULL COMMENT 'OrderSnapshot ID',
    `product_id` BIGINT(20) NOT NULL COMMENT 'Payment Service의 Product ID (Internal PK, 서비스 내부 FK)',
    `ecommerce_product_public_id` VARCHAR(20) NOT NULL COMMENT 'E-commerce Service의 Product Public ID (Snowflake Base62, Kafka 이벤트용)',
    `quantity` INT NOT NULL COMMENT '주문 수량',
    `price` DECIMAL(15, 3) NOT NULL COMMENT '상품 단가',
    `created_at` DATETIME NOT NULL COMMENT '생성 일시',
    `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_public_id` (`public_id`) USING BTREE,
    KEY `idx_snapshot_id` (`snapshot_id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_ecommerce_product_public_id` (`ecommerce_product_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주문 스냅샷 항목 (결제 취소 시 재고 복원용)';
