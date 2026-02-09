package com.hamsterworld.notification

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

/**
 * Notification Service Application
 *
 * ## 주요 기능
 * 1. **DLQ 관리**: Kafka DLT 토픽에서 실패한 메시지 수신 및 MongoDB 저장
 * 2. **알림 발송**: Discord, Slack 등으로 실패 알림 전송
 * 3. **재처리 API**: DLQ 메시지 재처리 및 상태 관리
 *
 * ## MongoDB 사용
 * - MySQL 대신 MongoDB 사용 (DLQ 메시지는 비정형 데이터)
 * - DataSourceAutoConfiguration 제외 필요
 */
@SpringBootApplication(
    scanBasePackages = [
        "com.hamsterworld.notification",
        "com.hamsterworld.common"
    ],
    exclude = [DataSourceAutoConfiguration::class]  // MongoDB만 사용, MySQL 제외
)
@ConfigurationPropertiesScan(
    basePackages = [
        "com.hamsterworld.notification",
        "com.hamsterworld.common"
    ]
)
class NotificationApplication

fun main(args: Array<String>) {
    runApplication<NotificationApplication>(*args)
}
