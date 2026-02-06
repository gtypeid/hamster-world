-- Audit Logs 테이블 (엔티티 변경 감사)
-- Common 모듈에서 모든 서비스의 Entity 변경 이력을 기록

CREATE TABLE `audit_logs` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',

    -- 추적 정보
    `trace_id` VARCHAR(100) NOT NULL COMMENT 'Trace ID (분산 추적)',

    -- 대상 엔티티 정보
    `target_id` BIGINT(20) NOT NULL COMMENT 'Target Entity ID (Internal PK)',
    `target_type` VARCHAR(100) NOT NULL COMMENT 'Target Entity Type (Class Name)',

    -- 변경 정보
    `operation` VARCHAR(20) NOT NULL COMMENT 'Operation Type (CREATE, UPDATE, DELETE)',
    `prev` MEDIUMTEXT NULL COMMENT 'Previous State (JSON)',
    `after` MEDIUMTEXT NULL COMMENT 'After State (JSON)',

    -- 사용자 정보
    `user_id` BIGINT(20) NULL COMMENT 'User ID (Internal PK)',
    `user_login_id` VARCHAR(100) NULL COMMENT 'User Login ID',
    `user_name` VARCHAR(100) NULL COMMENT 'User Name',

    -- 공통 필드
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
    `modified_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시',

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_audit_logs_public_id` (`public_id`) USING BTREE,
    KEY `idx_audit_logs_trace_id` (`trace_id`) USING BTREE,
    KEY `idx_audit_logs_target` (`target_type`, `target_id`) USING BTREE,
    KEY `idx_audit_logs_operation` (`operation`) USING BTREE,
    KEY `idx_audit_logs_user_id` (`user_id`) USING BTREE,
    KEY `idx_audit_logs_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entity 변경 감사 로그';
