-- Hamster PG Service: PG MID 테이블
-- PG 가맹점 (MID) 관리

DROP TABLE IF EXISTS `pg_mids`;
CREATE TABLE `pg_mids` (
    `id`            BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`     VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `mid_id`        VARCHAR(100) NOT NULL COMMENT 'MID 코드',
    `merchant_name` VARCHAR(200) NOT NULL COMMENT '가맹점명',
    `api_key`       VARCHAR(100) NOT NULL COMMENT 'API Key',
    `is_active`     BOOLEAN      NOT NULL DEFAULT TRUE COMMENT '활성 여부',
    `created_at`    DATETIME     NOT NULL,
    `modified_at`   DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_pg_mids_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_pg_mids_mid_id` (`mid_id`) USING BTREE,
    UNIQUE KEY `idx_pg_mids_api_key` (`api_key`) USING BTREE,
    KEY `idx_pg_mids_is_active` (`is_active`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='PG 가맹점 (MID) 관리';
