-- Hamster PG Service: Payment Process 테이블
-- PG 처리 프로세스 (Cash Gateway의 PaymentProcess와 대칭 구조)
-- Notification 추적은 Payment 엔티티에서 담당

DROP TABLE IF EXISTS `payment_processes`;
CREATE TABLE `payment_processes` (
    `id`                    BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`             VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `tid`                   VARCHAR(100)   NOT NULL COMMENT 'PG Transaction ID',
    `mid_id`                VARCHAR(100)   NOT NULL COMMENT '가맹점 ID (PgMid.midId)',
    `order_id`              VARCHAR(255)   NOT NULL COMMENT '주문 ID (Cash Gateway orderNumber)',
    `user_id`               VARCHAR(100)   NULL COMMENT '사용자 ID',
    `amount`                DECIMAL(15, 3) NOT NULL COMMENT '거래 금액',
    `status`                VARCHAR(20)    NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, PROCESSING, SUCCESS, FAILED',
    `approval_no`           VARCHAR(50)    NULL COMMENT '승인번호 (성공 시)',
    `fail_reason`           VARCHAR(255)   NULL COMMENT '실패 사유',
    `echo`                  JSON           NULL COMMENT 'Cash Gateway 메타데이터 (orderNumber, gatewayReferenceId 등)',
    `requested_at`          DATETIME       NOT NULL COMMENT '요청 접수 시각',
    `processing_started_at` DATETIME       NULL COMMENT '처리 시작 시각 (PROCESSING 진입)',
    `processed_at`          DATETIME       NULL COMMENT '최종 처리 시각 (SUCCESS/FAILED)',
    `created_at`            DATETIME       NOT NULL,
    `modified_at`           DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_payment_processes_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_payment_processes_tid` (`tid`) USING BTREE,
    KEY `idx_payment_processes_status` (`status`) USING BTREE,
    KEY `idx_payment_processes_mid_id` (`mid_id`) USING BTREE,
    KEY `idx_payment_processes_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='PG 처리 프로세스 (Cash Gateway PaymentProcess 대칭)';
