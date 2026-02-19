-- Hamster PG Service: Payment 테이블
-- 유의미한 거래 결과 (성공/실패)만 기록
-- PaymentProcessEventHandler를 통해서만 생성됨

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
    `id`                          BIGINT(20)     NOT NULL AUTO_INCREMENT COMMENT 'Internal PK (Auto-increment)',
    `public_id`                   VARCHAR(20)    NOT NULL COMMENT 'Public ID (Snowflake ID - Base62)',
    `tid`                         VARCHAR(100)   NOT NULL COMMENT 'PG Transaction ID (PaymentProcess.tid와 동일)',
    `mid_id`                      VARCHAR(100)   NOT NULL COMMENT '가맹점 ID (PgMid.midId)',
    `order_id`                    VARCHAR(255)   NOT NULL COMMENT '주문 ID',
    `user_id`                     VARCHAR(100)   NULL COMMENT '사용자 ID',
    `amount`                      DECIMAL(15, 3) NOT NULL COMMENT '결제 금액',
    `echo`                        JSON           NULL COMMENT 'Echo 데이터 (Cash Gateway 메타데이터)',
    `status`                      VARCHAR(20)    NOT NULL COMMENT '결제 상태 (COMPLETED, FAILED)',
    `approval_no`                 VARCHAR(50)    NULL COMMENT '승인 번호 (성공 시)',
    `failure_reason`              VARCHAR(255)   NULL COMMENT '결제 실패 사유',
    `processed_at`                DATETIME       NOT NULL COMMENT '처리 완료 시각',
    `notification_status`         VARCHAR(20)    NOT NULL DEFAULT 'NOT_SENT' COMMENT '알림 상태 (NOT_SENT, SENT, FAILED)',
    `notification_attempt_count`  INT            NOT NULL DEFAULT 0 COMMENT '알림 시도 횟수',
    `last_notification_at`        DATETIME       NULL COMMENT '마지막 알림 시각',
    `notification_error_message`  TEXT           NULL COMMENT '알림 에러 메시지',
    `created_at`                  DATETIME       NOT NULL,
    `modified_at`                 DATETIME       NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `idx_payments_public_id` (`public_id`) USING BTREE,
    UNIQUE KEY `idx_payments_tid` (`tid`) USING BTREE,
    KEY `idx_payments_mid_id` (`mid_id`) USING BTREE,
    KEY `idx_payments_order_id` (`order_id`) USING BTREE,
    KEY `idx_payments_status_created_at` (`status`, `created_at`),
    KEY `idx_payments_status_notification` (`status`, `notification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='유의미한 거래 결과 (PaymentProcessEventHandler에서만 생성)';
