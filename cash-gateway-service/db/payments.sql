DROP TABLE IF EXISTS `payments`;
CREATE TABLE payments (
                          id BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
                          public_id VARCHAR(20) NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
                          process_id BIGINT(20) NOT NULL COMMENT '참조된 PaymentProcess ID',
                          order_public_id VARCHAR(20) DEFAULT NULL COMMENT 'E-commerce Service의 Order Public ID (외부 거래는 NULL)',
                          user_public_id VARCHAR(20) DEFAULT NULL COMMENT 'E-commerce Service의 User Public ID (외부 거래는 NULL)',
                          provider VARCHAR(50) DEFAULT NULL COMMENT 'PG사 이름 (외부 거래는 NULL)',
                          mid VARCHAR(100) DEFAULT NULL COMMENT 'MID (Merchant ID)',
                          amount DECIMAL(15,3) NOT NULL COMMENT '결제 금액',
                          pg_transaction VARCHAR(100) NOT NULL COMMENT 'PG사 거래 ID',
                          pg_approval_no VARCHAR(100) NOT NULL COMMENT 'PG사 승인번호',
                          gateway_reference_id VARCHAR(255) NOT NULL COMMENT 'Cash Gateway 고유 거래 식별자 (PaymentProcess에서 자동 생성)',
                          status VARCHAR(20) NOT NULL COMMENT '결제 상태',
                          origin_payment_id BIGINT(20) DEFAULT NULL COMMENT '원 결제 ID (취소인 경우 참조)',
                          origin_source VARCHAR(100) DEFAULT NULL COMMENT '거래 출처 (NULL=내부, "partner-a"=외부)',
                          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
                          modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
                          PRIMARY KEY (id),
                          UNIQUE KEY idx_payments_public_id (public_id),
                          UNIQUE KEY uq_payments_process_id (process_id),
                          KEY idx_payments_order_public_id (order_public_id),
                          KEY idx_payments_user_public_id (user_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
