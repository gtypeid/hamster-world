DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
                              `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                              `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                              `cart_id` BIGINT(20) NOT NULL COMMENT '장바구니 ID',
                              `product_id` BIGINT(20) NOT NULL COMMENT '상품 ID',
                              `quantity` INT NOT NULL COMMENT '수량',
                              `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                              `modified_at` DATETIME NULL COMMENT '수정 일시',
                              PRIMARY KEY (`id`) USING BTREE,
                              UNIQUE KEY `idx_cart_items_public_id` (`public_id`) USING BTREE,
                              UNIQUE KEY `idx_cart_items_cart_product` (`cart_id`, `product_id`) USING BTREE,
                              KEY `idx_cart_items_product_id` (`product_id`),
                              CONSTRAINT `fk_cart_items_cart_id`
                                  FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
                              CONSTRAINT `fk_cart_items_product_id`
                                  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;