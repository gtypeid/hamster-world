-- Ecommerce Service: Order 테이블
-- 주문 관리

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id`                         BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`                  VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id`                    BIGINT(20)     NOT NULL COMMENT 'User Internal PK (같은 서비스 내부 FK)',
    `order_number`               VARCHAR(255)   NULL COMMENT '고객용 주문번호 (저장 시 자동 생성)',
    `gateway_payment_public_id`  VARCHAR(20)    NULL COMMENT 'Cash Gateway Service의 Payment Public ID (Snowflake Base62)',
    `price`                      DECIMAL(15, 3) NULL COMMENT '상품 총액 (할인 전)',
    `discount_amount`            DECIMAL(15, 3) NULL COMMENT '할인 금액 (쿠폰 등, null이면 할인 없음)',
    `coupon_code`                VARCHAR(50)    NULL COMMENT '적용된 쿠폰 코드 (null이면 미적용)',
    `final_price`                DECIMAL(15, 3) NULL COMMENT '최종 결제 금액 (price - discountAmount)',
    `status`                     VARCHAR(20)    NOT NULL COMMENT '주문 상태',
    `created_at`                 DATETIME       NOT NULL,
    `modified_at`                DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_orders_public_id` (`public_id`) USING BTREE,
    KEY `idx_orders_user_id` (`user_id`),
    KEY `idx_orders_coupon_code` (`coupon_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주문';
