-- Ecommerce Service: Coupon Policy Product 테이블
-- 쿠폰 정책 → 대상 상품 매핑 (조회 최적화)
--
-- ## 용도
-- - "이 상품에 적용 가능한 쿠폰 조회" 시 인덱스 활용
-- - CouponPolicy.conditionFiltersJson의 productIds를 Internal ID로 변환하여 구체화
--
-- ## 생성 시점
-- - CouponPolicy 생성 시 도메인 이벤트로 동기 생성

DROP TABLE IF EXISTS `coupon_policy_products`;
CREATE TABLE `coupon_policy_products` (
    `id`                BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`         VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `coupon_policy_id`  BIGINT(20)   NOT NULL COMMENT '쿠폰 정책 ID (FK)',
    `product_id`        BIGINT(20)   NOT NULL COMMENT '대상 상품 ID (Internal FK)',
    `created_at`        DATETIME     NOT NULL,
    `modified_at`       DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_cpp_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_cpp_policy_product` (`coupon_policy_id`, `product_id`) USING BTREE,
    KEY `idx_cpp_coupon_policy_id` (`coupon_policy_id`) USING BTREE,
    KEY `idx_cpp_product_id` (`product_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쿠폰 정책 대상 상품 매핑 (조회 최적화)';
