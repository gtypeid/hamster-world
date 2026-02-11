-- Ecommerce Service: Merchant 테이블
-- 판매자 (User와 1:1 관계)

DROP TABLE IF EXISTS `merchants`;
CREATE TABLE `merchants` (
    `id`                       BIGINT(20)    NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`                VARCHAR(20)   NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_id`                  BIGINT(20)    NOT NULL COMMENT 'User Internal PK (1:1, 같은 서비스 내부 FK)',
    `cash_gateway_mid`         VARCHAR(100)  NOT NULL COMMENT 'Cash Gateway 발급 MID (평문 코드, 예: MID_1234)',
    `status`                   VARCHAR(20)   NOT NULL COMMENT 'PENDING, ACTIVE, SUSPENDED, CLOSED',
    -- Embedded: BusinessInfo
    `business_name`            VARCHAR(255)  NOT NULL COMMENT '상호명',
    `business_number`          VARCHAR(20)   NOT NULL COMMENT '사업자등록번호',
    `representative_name`      VARCHAR(255)  NOT NULL COMMENT '대표자명',
    `business_address`         VARCHAR(255)  NULL COMMENT '사업장 주소',
    `business_type`            VARCHAR(255)  NULL COMMENT '업종',
    -- Embedded: StoreInfo
    `store_name`               VARCHAR(255)  NOT NULL COMMENT '스토어명',
    `contact_email`            VARCHAR(255)  NOT NULL COMMENT '연락처 이메일',
    `contact_phone`            VARCHAR(20)   NOT NULL COMMENT '연락처 전화번호',
    `operating_hours`          VARCHAR(255)  NULL COMMENT '운영 시간',
    `store_description`        TEXT          NULL COMMENT '스토어 소개',
    `store_image_url`          VARCHAR(500)  NULL COMMENT '스토어 이미지 URL',
    -- Embedded: SettlementInfo
    `bank_name`                VARCHAR(255)  NOT NULL COMMENT '은행명',
    `account_number`           VARCHAR(255)  NOT NULL COMMENT '계좌번호',
    `account_holder`           VARCHAR(255)  NOT NULL COMMENT '예금주',
    `settlement_cycle`         VARCHAR(20)   NOT NULL COMMENT 'DAILY, WEEKLY, BIWEEKLY, MONTHLY',
    `platform_commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 3.50 COMMENT '플랫폼 수수료율 (%)',
    -- AbsDomain
    `created_at`               DATETIME      NOT NULL,
    `modified_at`              DATETIME      NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_merchants_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_merchants_user_id` (`user_id`) USING BTREE,
    UNIQUE KEY `idx_merchants_cash_gateway_mid` (`cash_gateway_mid`) USING BTREE,
    UNIQUE KEY `idx_merchants_business_number` (`business_number`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='머천트 (판매자)';
