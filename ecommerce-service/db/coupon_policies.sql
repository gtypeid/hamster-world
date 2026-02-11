-- Ecommerce Service: Coupon Policy 테이블
-- 쿠폰 정책 관리 (플랫폼/판매자 쿠폰)
--
-- ## 쿠폰 타입
-- - PLATFORM: Hamster World 발급 (모든 판매자 상품 적용 가능)
-- - MERCHANT: 특정 판매자 발급 (해당 판매자 상품만 적용)
--
-- ## 사용 조건
-- - min_order_amount: 최소 주문 금액
-- - condition_filters: JSON 필터 (categories, productIds, merchantIds)
--
-- ## 할인 계산
-- - FIXED: 정액 할인 (예: 5000원 할인)
-- - PERCENTAGE: 정률 할인 (예: 10% 할인, 최대 10000원)

DROP TABLE IF EXISTS `coupon_policies`;
CREATE TABLE `coupon_policies` (
    `id`                  BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`           VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `coupon_code`         VARCHAR(50)    NOT NULL COMMENT '쿠폰 코드 (사용자가 입력하는 코드, 예: SPRING2025)',
    `name`                VARCHAR(200)   NOT NULL COMMENT '쿠폰 이름 (예: 봄맞이 10% 할인)',
    `description`         TEXT           COMMENT '설명',
    `issuer_type`         VARCHAR(50)    NOT NULL COMMENT '발급 주체 (PLATFORM, MERCHANT)',
    `merchant_id`         BIGINT(20)     NULL COMMENT '판매자 ID (MERCHANT 쿠폰일 때만 사용)',
    `status`              VARCHAR(50)    NOT NULL COMMENT '쿠폰 상태 (ACTIVE, INACTIVE, EXPIRED)',
    `valid_from`          DATETIME       NOT NULL COMMENT '유효 시작 시간',
    `valid_until`         DATETIME       NOT NULL COMMENT '유효 종료 시간',
    `coupon_days`         INT            NOT NULL DEFAULT 10 COMMENT '발급 후 사용 가능 일수 (기본 10일)',
    `min_order_amount`    DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '최소 주문 금액 (0이면 제한 없음)',
    `condition_filters`   TEXT           NULL COMMENT '필터 JSON (카테고리, 상품, 판매자 제약)',
    `discount_type`       VARCHAR(50)    NOT NULL COMMENT '할인 유형 (FIXED, PERCENTAGE)',
    `discount_value`      DECIMAL(15, 2) NOT NULL COMMENT '할인 값 (FIXED: 금액, PERCENTAGE: 비율)',
    `max_discount_amount` DECIMAL(15, 2) NULL COMMENT '최대 할인 금액 (PERCENTAGE일 때만 사용)',
    `created_at`          DATETIME       NOT NULL,
    `modified_at`         DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_coupon_policy_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_coupon_policy_code` (`coupon_code`) USING BTREE,
    KEY `idx_coupon_policy_merchant_id` (`merchant_id`) USING BTREE,
    KEY `idx_coupon_policy_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쿠폰 정책 (플랫폼/판매자 쿠폰 관리)';
