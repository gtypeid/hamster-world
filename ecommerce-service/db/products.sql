-- Ecommerce Service: Product 테이블
-- 상품 카탈로그 관리 (Source of Truth for metadata)
-- 재고는 Payment Service에서 동기화됨 (캐시)

DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id`                   BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`            VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `merchant_id`          BIGINT(20)     NOT NULL COMMENT 'Merchant ID (판매자)',
    `sku`                  VARCHAR(100)   NOT NULL COMMENT '상품 코드 (Stock Keeping Unit)',
    `name`                 VARCHAR(200)   NOT NULL COMMENT '상품명',
    `description`          TEXT           NULL COMMENT '상품 설명',
    `image_url`            VARCHAR(500)   NULL COMMENT '상품 이미지 URL',
    `category`             VARCHAR(50)    NOT NULL COMMENT '카테고리',
    `price`                DECIMAL(10, 2) NOT NULL COMMENT '가격',
    `stock`                INT            NOT NULL DEFAULT 0 COMMENT '재고 (Payment Service에서 동기화, 캐시)',
    `is_sold_out`          BOOLEAN        NOT NULL DEFAULT FALSE COMMENT '품절 여부 (Payment Service에서 동기화)',
    `last_stock_synced_at` DATETIME       NULL COMMENT '마지막 재고 동기화 시각',
    `created_at`           DATETIME       NOT NULL,
    `modified_at`          DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_product_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_product_sku` (`sku`) USING BTREE,
    KEY `idx_products_merchant_id` (`merchant_id`),
    KEY `idx_product_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상품 카탈로그 (메타데이터 관리, 재고는 Payment Service에서 동기화)';
