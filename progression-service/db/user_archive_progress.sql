-- Progression Service: User Archive Progress 테이블
-- 사용자별 업적 진행도
--
-- ## 진행도 추적
-- - EVENT_BASED: 이벤트 발생 시 자동 진행 (Kafka Consumer)
-- - STAT_BASED: 통계 기반 수동 진행 (일괄 배치)
--
-- ## 상태
-- - is_completed: 완료 여부 (조건 충족)
-- - is_claimed: 보상 수령 여부

DROP TABLE IF EXISTS `user_archive_progress`;
CREATE TABLE `user_archive_progress` (
    `id`               BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`        VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_public_id`   VARCHAR(20)  NOT NULL COMMENT 'User Public ID (다른 서비스의 User)',
    `archive_id`       VARCHAR(255) NOT NULL COMMENT 'Archive Master ID',
    `current_progress` INT          NOT NULL DEFAULT 0 COMMENT '현재 진행도',
    `is_completed`     BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '완료 여부',
    `completed_at`     DATETIME     NULL COMMENT '완료 일시',
    `is_claimed`       BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '보상 수령 여부',
    `claimed_at`       DATETIME     NULL COMMENT '보상 수령 일시',
    `created_at`       DATETIME     NOT NULL,
    `modified_at`      DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_user_archive_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_user_archive` (`user_public_id`, `archive_id`) USING BTREE,
    KEY `idx_user_archive_user` (`user_public_id`) USING BTREE,
    KEY `idx_user_archive_completed` (`is_completed`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자별 업적 진행도 (이벤트/통계 기반)';
