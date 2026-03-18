DROP TABLE IF EXISTS `product_records`;
CREATE TABLE `product_records` (
                                   `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                                   `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                                   `product_id` BIGINT(20) NOT NULL COMMENT '참조된 상품 ID',
                                   `stock` INT NOT NULL COMMENT '수량 (+입고, -출고)',
                                   `reason` VARCHAR(100) NOT NULL COMMENT '변경 사유 (ex. 주문, 입고, 환불)',
                                   `created_at` DATETIME NOT NULL COMMENT '생성 일시',
                                   `modified_at` DATETIME NULL COMMENT '수정 일시',
                                   PRIMARY KEY (`id`),
                                   UNIQUE KEY `idx_product_records_public_id` (`public_id`) USING BTREE,
                                   KEY `idx_product_id` (`product_id`),
                                   CONSTRAINT `fk_product_records_product_id`
                                       FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                                           ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
