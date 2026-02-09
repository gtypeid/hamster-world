package com.hamsterworld.common.web.kafka

import org.apache.kafka.clients.consumer.ConsumerConfig
import org.apache.kafka.common.serialization.StringDeserializer
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory
import org.springframework.kafka.core.ConsumerFactory
import org.springframework.kafka.core.DefaultKafkaConsumerFactory
import org.springframework.kafka.listener.ContainerProperties

/**
 * Kafka Consumer 설정
 *
 * ## 변경 이력
 * - **2026-02-09** (Claude Opus 4 / claude-opus-4-6):
 *   `isObservationEnabled = true` 추가하여 Consumer 측 분산 추적 활성화.
 *   이 설정이 없으면 Kafka 메시지의 traceparent 헤더가 무시되어
 *   Consumer가 항상 새 traceId를 생성함 (Grafana Tempo에서 서비스별 별도 trace).
 *
 * ## 커스텀 빈과 YAML 자동설정의 관계
 * 이 클래스에서 `kafkaListenerContainerFactory` 빈을 직접 정의하기 때문에,
 * Spring Boot의 `KafkaAutoConfiguration`이 생성하는 기본 ContainerFactory는 사용되지 않음.
 * 따라서 `application-kafka.yml`의 `spring.kafka.listener.observation-enabled: true`는
 * 이 커스텀 빈에 적용되지 않으며, 반드시 프로그래밍 방식으로 설정해야 함:
 * ```kotlin
 * factory.containerProperties.isObservationEnabled = true
 * ```
 *
 * ## 제공 기능
 * - ConsumerFactory 생성
 * - KafkaListenerContainerFactory 생성 (manual ack 모드 + observation 활성화)
 * - 에러 처리 (KafkaErrorHandlerConfig와 연동)
 *
 * ## 설정 방법
 * application.yml에 다음 설정 추가:
 * ```yaml
 * spring:
 *   kafka:
 *     bootstrap-servers: localhost:9092
 *     consumer:
 *       group-id: my-service-consumer
 *       auto-offset-reset: earliest
 *       enable-auto-commit: false
 * ```
 */
@Configuration
@EnableConfigurationProperties(
    EventRegistryProperties::class,
    KafkaTopologyProperties::class
)
class KafkaConsumerConfig {

    @Value("\${spring.kafka.bootstrap-servers}")
    private lateinit var bootstrapServers: String

    @Value("\${spring.kafka.consumer.group-id}")
    private lateinit var groupId: String

    @Value("\${spring.kafka.consumer.auto-offset-reset:earliest}")
    private lateinit var autoOffsetReset: String

    @Bean
    fun consumerFactory(): ConsumerFactory<String, String> {
        val props = mapOf(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG to bootstrapServers,
            ConsumerConfig.GROUP_ID_CONFIG to groupId,
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG to autoOffsetReset,
            ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG to false,  // Manual ack
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG to StringDeserializer::class.java,
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG to StringDeserializer::class.java
        )
        return DefaultKafkaConsumerFactory(props)
    }

    @Bean
    fun kafkaListenerContainerFactory(
        consumerFactory: ConsumerFactory<String, String>
    ): ConcurrentKafkaListenerContainerFactory<String, String> {
        val factory = ConcurrentKafkaListenerContainerFactory<String, String>()
        factory.consumerFactory = consumerFactory

        // Manual Acknowledgment 모드
        factory.containerProperties.ackMode = ContainerProperties.AckMode.MANUAL

        // [2026-02-09] Claude Opus 4: Observation 활성화
        // Kafka 메시지 수신 시 W3C traceparent 헤더에서 traceId/spanId를 자동 추출하여
        // micrometer scope에 parent span으로 설정함.
        // 이를 통해 Producer가 주입한 traceId가 Consumer 측에서도 이어져 서비스 간 단일 trace 형성.
        // application-kafka.yml의 listener.observation-enabled은 이 커스텀 빈에 적용되지 않으므로
        // 반드시 여기서 프로그래밍 방식으로 설정해야 함.
        factory.containerProperties.isObservationEnabled = true

        // 에러 처리는 KafkaErrorHandlerConfig에서 설정

        return factory
    }
}
