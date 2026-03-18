DROP TABLE IF EXISTS `quotas`;
CREATE TABLE `quotas` (
    `id`              BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`       VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_public_id`  VARCHAR(20)  NOT NULL COMMENT 'User Public ID',
    `quota_key`       VARCHAR(255) NOT NULL COMMENT 'Quota Key (quotas.csv의 quota_key)',
    `cycle_type`      VARCHAR(255) NOT NULL COMMENT 'Cycle Type (DAILY, WEEKLY, MONTHLY, NEVER)',
    `quota_type`      VARCHAR(255) NOT NULL COMMENT 'Quota Type (ACTION_CONSTRAINT, ACTION_REWARD)',
    `max_limit`       INT          NOT NULL COMMENT '최대 한도',
    `consumed`        INT          NOT NULL DEFAULT 0 COMMENT '현재 소비량',
    `claimed`         BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '보상 수령 여부 (ACTION_REWARD만)',
    `last_reset_at`   DATETIME     NOT NULL COMMENT '마지막 리셋 시각',
    `created_at`      DATETIME     NOT NULL,
    `modified_at`     DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_quota_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_quota_user_key` (`user_public_id`, `quota_key`) USING BTREE,
    KEY `idx_quota_user` (`user_public_id`) USING BTREE,
    KEY `idx_quota_key` (`quota_key`) USING BTREE,
    KEY `idx_quota_cycle` (`cycle_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주기별 할당량 (주간/월간 미션)';
