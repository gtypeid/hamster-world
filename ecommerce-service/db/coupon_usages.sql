-- Ecommerce Service: Coupon Usage 테이블
-- 쿠폰 사용 기록
--
-- ## 멱등성 보장
-- - UNIQUE(user_id, coupon_code): 1유저 1쿠폰 1회 사용
-- - DB 레벨 제약으로 중복 사용 방지
--
-- ## 사용 흐름
-- 1. User가 주문 시 쿠폰 적용 요청
-- 2. CouponPolicy 조회 및 검증 (상태, 기간, 조건)
-- 3. UserCoupon 수령 여부 + 사용 가능 상태 확인
-- 4. CouponUsage 생성 (UNIQUE 제약으로 중복 방지)
-- 5. 할인 금액 계산 및 저장 + UserCoupon 상태 USED 전환

DROP TABLE IF EXISTS `coupon_usages`;
CREATE TABLE `coupon_usages` (
    `id`               BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`        VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id`          BIGINT(20)     NOT NULL COMMENT 'User Internal PK',
    `coupon_policy_id` BIGINT(20)     NOT NULL COMMENT 'Coupon Policy Internal PK (FK)',
    `coupon_code`      VARCHAR(50)    NOT NULL COMMENT '쿠폰 코드 (중복 방지용)',
    `order_id`         BIGINT(20)     NOT NULL COMMENT 'Order Internal PK (FK)',
    `order_public_id`  VARCHAR(20)    NOT NULL COMMENT 'Order Public ID (Kafka 이벤트용)',
    `discount_amount`  DECIMAL(15, 2) NOT NULL COMMENT '실제 적용된 할인 금액',
    `created_at`       DATETIME       NOT NULL,
    `modified_at`      DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_coupon_usage_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_user_coupon` (`user_id`, `coupon_code`) USING BTREE,
    KEY `idx_coupon_usage_user_id` (`user_id`) USING BTREE,
    KEY `idx_coupon_usage_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='쿠폰 사용 기록 (1유저 1쿠폰 1회 제약)';
