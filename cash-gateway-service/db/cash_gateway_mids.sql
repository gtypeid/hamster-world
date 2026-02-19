DROP TABLE IF EXISTS `cash_gateway_mids`;
CREATE TABLE cash_gateway_mids (
                                    id BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                                    public_id VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                                    provider VARCHAR(50) NOT NULL COMMENT 'PG사 Provider (DUMMY, TOSS 등)',
                                    mid VARCHAR(100) NOT NULL COMMENT 'Cash Gateway MID (Cash Gateway가 발급한 가맹점 식별자)',
                                    pg_mid VARCHAR(100) NOT NULL COMMENT 'PG MID (PG사에 등록된 실제 가맹점 ID)',
                                    user_keycloak_id VARCHAR(100) NOT NULL COMMENT '이 MID의 주체 (Keycloak 유저 ID)',
                                    origin_source VARCHAR(100) DEFAULT NULL COMMENT '거래 출처 (NULL=Cash Gateway 자체, "partner-a"=파트너사)',
                                    description VARCHAR(255) DEFAULT NULL COMMENT 'MID 설명',
                                    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
                                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
                                    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
                                    PRIMARY KEY (id),
                                    UNIQUE KEY idx_cash_gateway_mids_public_id (public_id),
                                    UNIQUE KEY uq_provider_mid (provider, mid),
                                    KEY idx_provider_user_keycloak_id (provider, user_keycloak_id),
                                    KEY idx_origin_source (origin_source),
                                    KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data: Cash Gateway 기본 MID (내부 거래용)
INSERT INTO cash_gateway_mids (public_id, provider, mid, pg_mid, user_keycloak_id, origin_source, description, is_active)
VALUES ('CGWMID000000000001', 'DUMMY', 'CGW_MID_001', 'hamster_dummy_mid_001', 'keycloak-user-001', NULL, 'Cash Gateway 기본 MID (내부 거래)', TRUE);
