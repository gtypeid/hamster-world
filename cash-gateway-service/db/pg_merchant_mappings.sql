DROP TABLE IF EXISTS `pg_merchant_mappings`;
CREATE TABLE pg_merchant_mappings (
                                      id BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                                      public_id VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                                      provider VARCHAR(50) NOT NULL COMMENT 'PG사 이름 (TOSS, NICE_PAY 등)',
                                      mid VARCHAR(100) NOT NULL COMMENT 'MID (Merchant ID)',
                                      origin_source VARCHAR(100) DEFAULT NULL COMMENT '거래 출처 (NULL=Cash Gateway 자체, "partner-a"=파트너사)',
                                      description VARCHAR(255) DEFAULT NULL COMMENT 'MID 설명',
                                      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
                                      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
                                      modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
                                      PRIMARY KEY (id),
                                      UNIQUE KEY idx_pg_merchant_mappings_public_id (public_id),
                                      UNIQUE KEY uq_provider_mid (provider, mid),
                                      KEY idx_origin_source (origin_source),
                                      KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data: Cash Gateway's own MID
INSERT INTO pg_merchant_mappings (public_id, provider, mid, origin_source, description, is_active)
VALUES ('PGMID0000000000001', 'TOSS', 'hamster_toss_mid_001', NULL, 'Cash Gateway 자체 토스 MID', TRUE);

-- Sample data: Partner A's MID
INSERT INTO pg_merchant_mappings (public_id, provider, mid, origin_source, description, is_active)
VALUES ('PGMID0000000000002', 'TOSS', 'partner_a_toss_mid', 'partner-a', 'Partner A 토스 MID', TRUE);
