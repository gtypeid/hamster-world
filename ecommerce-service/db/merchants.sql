CREATE TABLE merchants
(
    id                        BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Internal PK (Auto-increment)',
    public_id                 VARCHAR(20)    NOT NULL UNIQUE COMMENT 'Public ID (Snowflake ID - Base62)',
    user_id                   BIGINT         NOT NULL UNIQUE COMMENT 'User Internal PK (1:1, 같은 서비스 내부 FK)',
    cash_gateway_mid          VARCHAR(100)   NOT NULL UNIQUE COMMENT 'Cash Gateway 발급 MID (평문 코드, 예: MID_1234)',
    status                    VARCHAR(20)    NOT NULL COMMENT 'PENDING, ACTIVE, SUSPENDED, CLOSED',

    -- Business Info (사업자 정보)
    business_name             VARCHAR(100)   NOT NULL COMMENT '상호명',
    business_number           VARCHAR(20)    NOT NULL UNIQUE COMMENT '사업자등록번호',
    representative_name       VARCHAR(50)    NOT NULL COMMENT '대표자명',
    business_address          VARCHAR(255) COMMENT '사업장 주소',
    business_type             VARCHAR(50) COMMENT '업종',

    -- Store Info (스토어 정보)
    store_name                VARCHAR(100)   NOT NULL COMMENT '스토어명',
    contact_email             VARCHAR(100)   NOT NULL COMMENT '연락처 이메일',
    contact_phone             VARCHAR(20)    NOT NULL COMMENT '연락처 전화번호',
    operating_hours           VARCHAR(255) COMMENT '운영 시간',
    store_description         TEXT COMMENT '스토어 소개',
    store_image_url           VARCHAR(500) COMMENT '스토어 이미지 URL',

    -- Settlement Info (정산 정보)
    bank_name                 VARCHAR(50)    NOT NULL COMMENT '은행명',
    account_number            VARCHAR(50)    NOT NULL COMMENT '계좌번호',
    account_holder            VARCHAR(50)    NOT NULL COMMENT '예금주',
    settlement_cycle          VARCHAR(20)    NOT NULL COMMENT 'DAILY, WEEKLY, BIWEEKLY, MONTHLY',
    platform_commission_rate  DECIMAL(5, 2)  NOT NULL DEFAULT 3.50 COMMENT '플랫폼 수수료율 (%)',

    -- Audit
    created_at                DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at               DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_merchants_public_id (public_id),
    INDEX idx_merchants_user_id (user_id),
    INDEX idx_merchants_cash_gateway_mid (cash_gateway_mid)
) COMMENT = '머천트 (판매자) 테이블';
