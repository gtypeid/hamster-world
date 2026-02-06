package com.hamsterworld.common.web.kafka

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource
import org.springframework.stereotype.Component

/**
 * Kafka Topology Property Registrar
 *
 * kafka-topology.yml의 토픽 정보를 Spring Property로 자동 등록합니다.
 *
 * ## 등록되는 Property
 * 1. **kafka.topics.{토픽명}**: 각 토픽 이름을 Property로 등록
 *    - 예: `kafka.topics.ecommerce-events = ecommerce-events`
 *
 * 2. **kafka.service.{서비스명}.topic**: 각 서비스의 첫 번째 소유 토픽
 *    - 예: `kafka.service.ecommerce-service.topic = ecommerce-events`
 *
 * ## 사용 예시
 * ```yaml
 * # kafka-event-registry.yml
 * event:
 *   publishes:
 *     - topic: ${kafka.service.ecommerce-service.topic}  # ← 자기 서비스 토픽
 *       events: [...]
 *
 *   subscribes:
 *     - topic: ${kafka.topics.payment-events}  # ← 다른 토픽
 *       events: [...]
 * ```
 *
 * @property kafkaTopologyProperties kafka-topology.yml 설정
 * @property environment Spring Environment
 */
@Component
class KafkaTopologyPropertyRegistrar(
    private val kafkaTopologyProperties: KafkaTopologyProperties,
    private val environment: ConfigurableEnvironment
) {

    private val logger = LoggerFactory.getLogger(KafkaTopologyPropertyRegistrar::class.java)

    init {
        // BeanPostProcessor보다 먼저 실행되어야 하므로 @PostConstruct 대신 init 블록 사용
        registerTopicsAsProperties()
    }

    private fun registerTopicsAsProperties() {
        val properties = mutableMapOf<String, Any>()

        // 1. kafka.topics.{토픽명} = {토픽명}
        kafkaTopologyProperties.topics.forEach { topic ->
            properties["kafka.topics.${topic.name}"] = topic.name
        }

        // 2. kafka.service.{서비스명}.topic = {첫 번째 소유 토픽}
        kafkaTopologyProperties.services.forEach { service ->
            val primaryTopic = service.owns.firstOrNull()
            if (primaryTopic != null) {
                properties["kafka.service.${service.name}.topic"] = primaryTopic
            }
        }

        // Spring Environment에 등록
        val propertySource = MapPropertySource("kafkaTopologyProperties", properties)
        environment.propertySources.addFirst(propertySource)

        logger.info("========================================")
        logger.info("Kafka Topology Properties 등록 완료")
        logger.info("========================================")

        logger.info("토픽 Properties:")
        kafkaTopologyProperties.topics.forEach { topic ->
            logger.info("  kafka.topics.${topic.name} = ${topic.name}")
        }

        logger.info("서비스별 Primary Topic Properties:")
        kafkaTopologyProperties.services.forEach { service ->
            val primaryTopic = service.owns.firstOrNull()
            if (primaryTopic != null) {
                logger.info("  kafka.service.${service.name}.topic = $primaryTopic")
            } else {
                logger.warn("  ⚠️  서비스 '${service.name}'는 소유 토픽이 없습니다.")
            }
        }
    }
}
