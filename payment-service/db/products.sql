DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
                            `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                            `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                            `ecommerce_product_id` VARCHAR(20) NULL COMMENT 'E-commerce Service의 Product Public ID (Snowflake Base62)',
                            `sku` VARCHAR(100) NOT NULL COMMENT 'SKU (Stock Keeping Unit)',
                            `week_id` VARCHAR(36) NOT NULL COMMENT '지연 FK',
                            `name` VARCHAR(255) NOT NULL COMMENT '상품명',
                            `price` decimal(15, 3) NOT NULL COMMENT '상품 가격',
                            `description` TEXT NULL COMMENT '상품 설명',
                            `stock` INT NOT NULL COMMENT '재고 수량',
                            `is_sold_out` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '품절 여부 (1=품절, 0=판매중)',
                            `category` VARCHAR(50) NOT NULL COMMENT '상품 카테고리',
                            `last_recorded_at` DATETIME NULL COMMENT '마지막 재집계 시점',
                            `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                            `modified_at` DATETIME NULL COMMENT '수정 일시',
                            PRIMARY KEY (`id`) USING BTREE,
                            UNIQUE KEY `idx_products_public_id` (`public_id`) USING BTREE,
                            UNIQUE KEY `idx_products_sku` (`sku`) USING BTREE,
                            INDEX `idx_products_ecommerce_product_id` (`ecommerce_product_id`) USING BTREE,
                            INDEX `idx_category` (`category`) USING BTREE,
                            CONSTRAINT `chk_stock_non_negative` CHECK (`stock` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
