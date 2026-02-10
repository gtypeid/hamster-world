package com.hamsterworld.notification

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.scheduling.annotation.EnableScheduling

/**
 * Notification Service Application
 *
 * ## 주요 기능
 * 1. **DLQ 관리**: Kafka DLT 토픽에서 실패한 메시지 수신 및 MongoDB 저장
 * 2. **알림 발송**: Discord, Slack 등으로 실패 알림 전송
 * 3. **재처리 API**: DLQ 메시지 재처리 및 상태 관리
 *
 * ## 데이터 저장소
 * - **MongoDB**: DLQ 메시지 저장 (비정형 데이터)
 * - **MySQL (JPA)**: common 모듈의 ProcessedEvent 등 JPA 엔티티 저장
 */
@SpringBootApplication(scanBasePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EnableJpaRepositories(basePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EntityScan(basePackages = ["com.hamsterworld.common", "com.hamsterworld.notification"])
@EnableScheduling
class NotificationApplication

fun main(args: Array<String>) {
    runApplication<NotificationApplication>(*args)
}
