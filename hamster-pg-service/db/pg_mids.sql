CREATE TABLE pg_mids (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Internal PK (Auto-increment)',
    public_id VARCHAR(20) NOT NULL UNIQUE COMMENT 'Public ID (Snowflake ID - Base62)',
    mid_id VARCHAR(100) NOT NULL UNIQUE,
    merchant_name VARCHAR(200) NOT NULL,
    api_key VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_pg_mids_public_id (public_id),
    INDEX idx_mid_id (mid_id),
    INDEX idx_api_key (api_key),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
