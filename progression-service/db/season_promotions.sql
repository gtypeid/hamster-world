-- Progression Service: Season Promotion 테이블
-- 사용자별 시즌 프로모션 진행도 (배틀패스)
--
-- ## 특징
-- - Step 기반 진행 (0 → maxStep)
-- - 2-track 보상: 기본 + VIP 보너스
-- - claimedSteps: ElementCollection (별도 테이블 season_promotion_claimed_steps)
--
-- ## 제약
-- - UNIQUE(user_public_id, promotion_id): 1유저 1시즌 1회

DROP TABLE IF EXISTS `season_promotion_claimed_steps`;
DROP TABLE IF EXISTS `season_promotions`;
CREATE TABLE `season_promotions` (
    `id`              BIGINT(20)   NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`       VARCHAR(20)  NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `user_public_id`  VARCHAR(20)  NOT NULL COMMENT 'User Public ID',
    `promotion_id`    VARCHAR(255) NOT NULL COMMENT 'Season Promotion ID (CSV 마스터)',
    `current_step`    INT          NOT NULL DEFAULT 0 COMMENT '현재 스텝',
    `is_vip`          BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'VIP 여부',
    `created_at`      DATETIME     NOT NULL,
    `modified_at`     DATETIME     NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_season_promotion_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `uk_season_promotion_user_promo` (`user_public_id`, `promotion_id`) USING BTREE,
    KEY `idx_season_promotion_user` (`user_public_id`) USING BTREE,
    KEY `idx_season_promotion_promo` (`promotion_id`) USING BTREE,
    KEY `idx_season_promotion_step` (`current_step`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자별 시즌 프로모션 진행도 (배틀패스)';

-- ElementCollection 테이블 (SeasonPromotion.claimedSteps)
CREATE TABLE `season_promotion_claimed_steps` (
    `season_promotion_id` BIGINT(20) NOT NULL COMMENT 'SeasonPromotion FK',
    `step`                INT        NOT NULL COMMENT '클레임한 스텝 번호',
    KEY `idx_claimed_steps_promotion` (`season_promotion_id`) USING BTREE,
    CONSTRAINT `fk_claimed_steps_promotion` FOREIGN KEY (`season_promotion_id`) REFERENCES `season_promotions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='시즌 프로모션 클레임 스텝 (ElementCollection)';
