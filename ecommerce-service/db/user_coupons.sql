-- Ecommerce Service: User Coupon 테이블
-- 사용자 쿠폰 발급/수령 기록
--
-- ## 역할
-- - CouponPolicy(템플릿)와 CouponUsage(사용 기록) 사이의 중간 단계
-- - 사용자가 쿠폰을 "수령"하면 UserCoupon이 생성됨
-- - 사용 시 status → USED, 기한 초과 시 status → EXPIRED
--
-- ## 사용 기한 계산
-- - expires_at = issued_at + CouponPolicy.coupon_days
-- - 예: coupon_days=7, 2/20 수령 → expires_at = 2/27
--
-- ## 제약
-- - 1유저 1쿠폰정책 1수령: UNIQUE(user_id, coupon_policy_id)

DROP TABLE IF EXISTS `user_coupons`;
CREATE TABLE `user_coupons` (
    `id`               BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`        VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id`          BIGINT(20)   NOT NULL COMMENT 'User Internal PK',
    `coupon_policy_id` BIGINT(20)   NOT NULL COMMENT 'Coupon Policy Internal PK (FK)',
    `coupon_code`      VARCHAR(50)  NOT NULL COMMENT '쿠폰 코드 (CouponPolicy.couponCode 복사)',
    `status`           VARCHAR(50)  NOT NULL COMMENT '상태 (AVAILABLE, USED, EXPIRED)',
    `issued_at`        DATETIME     NOT NULL COMMENT '수령 시점',
    `expires_at`       DATETIME     NOT NULL COMMENT '사용 만료 시점 (issued_at + coupon_days)',
    `used_at`          DATETIME     NULL COMMENT '사용 시점 (USED일 때만)',
    `created_at`       DATETIME     NOT NULL,
    `modified_at`      DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_user_coupon_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_user_coupon_policy` (`user_id`, `coupon_policy_id`) USING BTREE,
    KEY `idx_user_coupon_user_id` (`user_id`) USING BTREE,
    KEY `idx_user_coupon_status` (`status`) USING BTREE,
    KEY `idx_user_coupon_expires_at` (`expires_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 쿠폰 (수령/발급 기록)';
