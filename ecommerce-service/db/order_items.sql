DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
                               `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                               `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                               `order_id` BIGINT(20) NULL COMMENT '주문 ID',
                               `product_id` BIGINT(20) NULL COMMENT '상품 Internal ID (FK)',
                               `product_public_id` VARCHAR(20) NULL COMMENT 'Product Public ID (Kafka 이벤트용)',
                               `quantity` INT NULL COMMENT '수량',
                               `price` decimal(10, 2) NULL COMMENT '주문 당시 단가',
                               `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                               `modified_at` DATETIME NULL COMMENT '수정 일시',
                               PRIMARY KEY (`id`) USING BTREE,
                               UNIQUE KEY `idx_order_items_public_id` (`public_id`) USING BTREE,
                               KEY `idx_order_items_order_id` (`order_id`),
                               KEY `idx_order_items_product_id` (`product_id`),
                               CONSTRAINT `fk_order_items_order_id`
                                   FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
