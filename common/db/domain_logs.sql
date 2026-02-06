-- Domain Logs 테이블 (요청/응답 로깅)
-- Common 모듈에서 모든 서비스의 API 요청/응답을 기록

CREATE TABLE `domain_logs` (
    `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id` VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',

    -- 추적 정보
    `trace_id` VARCHAR(100) NOT NULL COMMENT 'Trace ID (분산 추적)',

    -- 요청 정보
    `ip` VARCHAR(50) NOT NULL COMMENT 'Client IP Address',
    `user_agent` VARCHAR(500) NOT NULL COMMENT 'User Agent',
    `uri` VARCHAR(500) NOT NULL COMMENT 'Request URI',
    `method` VARCHAR(10) NOT NULL COMMENT 'HTTP Method (GET, POST, etc.)',
    `parameters` TEXT NULL COMMENT 'Query String Parameters',
    `request_body` MEDIUMTEXT NULL COMMENT 'Request Body (JSON)',

    -- 응답 정보
    `response_body` MEDIUMTEXT NULL COMMENT 'Response Body (JSON)',
    `response_status` INT NULL COMMENT 'HTTP Response Status Code',
    `processing_result` VARCHAR(50) NULL COMMENT 'Processing Result (SUCCESS, ERROR, etc.)',
    `error_message` TEXT NULL COMMENT 'Error Message (if failed)',

    -- 공통 필드
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '생성일시',
    `modified_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '수정일시',

    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_domain_logs_public_id` (`public_id`) USING BTREE,
    KEY `idx_domain_logs_trace_id` (`trace_id`) USING BTREE,
    KEY `idx_domain_logs_created_at` (`created_at`) USING BTREE,
    KEY `idx_domain_logs_uri` (`uri`(100)) USING BTREE,
    KEY `idx_domain_logs_processing_result` (`processing_result`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 요청/응답 로그';
