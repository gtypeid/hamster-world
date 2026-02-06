-- PG 처리 프로세스 테이블
-- Cash Gateway의 PaymentProcess와 대칭 구조

DROP TABLE IF EXISTS payment_processes;

CREATE TABLE payment_processes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id VARCHAR(20) NOT NULL,
    tid VARCHAR(100) NOT NULL COMMENT 'PG Transaction ID',
    order_id VARCHAR(255) NOT NULL COMMENT '주문 ID (Cash Gateway orderNumber)',
    user_public_id VARCHAR(20) NULL COMMENT '사용자 Public ID',
    amount DECIMAL(15,3) NOT NULL COMMENT '거래 금액',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, PROCESSING, SUCCESS, FAILED',
    approval_no VARCHAR(50) NULL COMMENT '승인번호 (성공 시)',
    fail_reason VARCHAR(255) NULL COMMENT '실패 사유',
    echo JSON NULL COMMENT 'Cash Gateway 메타데이터 (mid, orderNumber, gatewayReferenceId)',
    webhook_url VARCHAR(500) NOT NULL DEFAULT 'http://127.0.0.1:8082/api/webhook/pg/DUMMY' COMMENT 'Webhook URL',
    webhook_sent_at DATETIME NULL COMMENT 'Webhook 전송 시각',
    webhook_response_code INT NULL COMMENT 'Webhook 응답 코드',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청 접수 시각',
    processing_started_at DATETIME NULL COMMENT '처리 시작 시각 (PROCESSING 진입)',
    processed_at DATETIME NULL COMMENT '최종 처리 시각 (SUCCESS/FAILED)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_payment_processes_public_id (public_id),
    UNIQUE KEY uk_payment_processes_tid (tid),
    KEY idx_payment_processes_status (status),
    KEY idx_payment_processes_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PG 처리 프로세스 (Cash Gateway PaymentProcess 대칭)';
