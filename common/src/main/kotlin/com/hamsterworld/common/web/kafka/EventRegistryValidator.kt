package com.hamsterworld.common.web.kafka

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.ApplicationListener
import org.springframework.stereotype.Component

/**
 * Event Registry 검증기
 *
 * kafka-event-registry.yml 및 kafka-topology.yml 설정을 검증합니다.
 * 불일치 시 애플리케이션을 강제 종료합니다.
 *
 * ## 검증 항목
 * 1. **서비스명 검증**: spring.application.name이 kafka-topology.yml에 정의되어 있는지
 * 2. **토픽 검증**: kafka-event-registry.yml의 모든 토픽이 kafka-topology.yml에 정의되어 있는지
 * 3. **이벤트 등록 검증**: 토픽별로 최소 1개 이상의 이벤트가 등록되어 있는지
 *
 * ## 실행 시점
 * - ApplicationReadyEvent: 모든 Bean 초기화 완료 후 실행
 * - 검증 실패 시 System.exit(1)로 즉시 종료
 *
 * @property eventRegistryProperties kafka-event-registry.yml 설정
 * @property kafkaTopologyProperties kafka-topology.yml 설정
 * @property currentServiceName spring.application.name (서비스명 검증용)
 */
@Component
class EventRegistryValidator(
    private val eventRegistryProperties: EventRegistryProperties,
    private val kafkaTopologyProperties: KafkaTopologyProperties,
    @Value("\${spring.application.name}") private val currentServiceName: String
) : ApplicationListener<ApplicationReadyEvent> {

    private val logger = LoggerFactory.getLogger(EventRegistryValidator::class.java)

    override fun onApplicationEvent(event: ApplicationReadyEvent) {
        logger.info("========================================")
        logger.info("Kafka Topology & Event Registry 검증 시작")
        logger.info("========================================")

        logger.info("서비스: {}", currentServiceName)

        // 1. 서비스명 검증 (kafka-topology.yml에 정의되어 있는지)
        validateServiceName()

        // 2. 구독 이벤트 검증 (토픽 존재 여부 + 이벤트 목록)
        validateSubscriptions()

        // 3. 발행 이벤트 검증 (토픽 존재 여부 + 이벤트 목록)
        validatePublications()

        logger.info("========================================")
        logger.info("✅ Kafka Topology & Event Registry 검증 완료")
        logger.info("========================================")
    }

    /**
     * 서비스명 검증
     *
     * spring.application.name이 kafka-topology.yml의 services 목록에 정의되어 있는지 검증합니다.
     */
    private fun validateServiceName() {
        if (!kafkaTopologyProperties.isServiceDefined(currentServiceName)) {
            logger.error("❌ 서비스 '{}' 가 kafka-topology.yml에 정의되지 않았습니다.", currentServiceName)
            logger.error("")
            logger.error("kafka-topology.yml의 services 목록에 다음을 추가하세요:")
            logger.error("services:")
            logger.error("  - name: {}", currentServiceName)
            logger.error("    description: (서비스 설명)")
            logger.error("")
            System.exit(1)
        }

        logger.info("✓ 서비스명 검증 완료: '{}'", currentServiceName)
    }

    /**
     * 구독 이벤트 검증
     *
     * kafka-event-registry.yml의 subscribes 설정을 검증합니다.
     * - 모든 토픽이 kafka-topology.yml에 정의되어 있어야 함
     * - 토픽별로 최소 1개 이상의 이벤트가 등록되어 있어야 함
     * - **예외**: DLT 토픽(토픽명이 -dlt로 끝나는 경우)은 events: [] 허용
     */
    private fun validateSubscriptions() {
        val subscriptions = eventRegistryProperties.event.subscribes

        if (subscriptions.isEmpty()) {
            logger.warn("⚠️  구독하는 이벤트가 없습니다. (event.subscribes가 비어있음)")
            return
        }

        logger.info("구독 이벤트 검증:")
        subscriptions.forEach { subscription ->
            val topic = subscription.topic
            val events = subscription.events

            if (topic.isBlank()) {
                logger.error("❌ kafka-event-registry.yml에 빈 토픽 이름이 있습니다.")
                System.exit(1)
            }

            // ✅ 토픽이 kafka-topology.yml에 정의되어 있는지 검증
            if (!kafkaTopologyProperties.isTopicDefined(topic)) {
                logger.error("❌ 토픽 '{}' 가 kafka-topology.yml에 정의되지 않았습니다.", topic)
                logger.error("")
                logger.error("kafka-topology.yml의 topics 목록에 다음을 추가하세요:")
                logger.error("topics:")
                logger.error("  - name: {}", topic)
                logger.error("    partitions: 3")
                logger.error("    replication-factor: 1")
                logger.error("    description: (토픽 설명)")
                logger.error("    owner: (소유 서비스)")
                logger.error("")
                System.exit(1)
            }

            // ✅ DLT 토픽 예외 처리
            // DLT(Dead Letter Topic)는 모든 실패 메시지를 수신하므로 특정 이벤트 타입이 없음
            val isDLTTopic = topic.endsWith("-dlt")

            if (events.isEmpty()) {
                if (isDLTTopic) {
                    // DLT 토픽은 events: [] 허용
                    logger.info("  - 토픽: {} (정의 ✓, DLT 토픽 - 이벤트 타입 무관)", topic)
                } else {
                    logger.error("❌ 토픽 '{}'에 구독할 이벤트가 하나도 등록되지 않았습니다.", topic)
                    logger.error("토픽을 구독하면서 이벤트를 하나도 처리하지 않는 것은 설정 오류일 가능성이 높습니다.")
                    logger.error("의도한 것이라면 해당 토픽을 구독 목록에서 제거하세요.")
                    logger.error("DLT 토픽이라면 토픽 이름이 '-dlt'로 끝나야 합니다. (예: ecommerce-events-dlt)")
                    System.exit(1)
                }
            } else {
                logger.info("  - 토픽: {} (정의 ✓)", topic)
                events.forEach { eventType ->
                    logger.info("      ✓ {}", eventType)
                }
            }
        }
    }

    /**
     * 발행 이벤트 검증
     *
     * kafka-event-registry.yml의 publishes 설정을 검증합니다.
     * - 모든 토픽이 kafka-topology.yml에 정의되어 있어야 함
     */
    private fun validatePublications() {
        val publications = eventRegistryProperties.event.publishes

        if (publications.isEmpty()) {
            logger.warn("⚠️  발행하는 이벤트가 없습니다. (event.publishes가 비어있음)")
            logger.warn("이 서비스가 이벤트를 발행하지 않는다면 정상입니다.")
            return
        }

        logger.info("발행 이벤트 검증:")
        publications.forEach { publication ->
            val topic = publication.topic
            val events = publication.events

            if (topic.isBlank()) {
                logger.error("❌ kafka-event-registry.yml에 빈 토픽 이름이 있습니다.")
                System.exit(1)
            }

            // ✅ 토픽이 kafka-topology.yml에 정의되어 있는지 검증
            if (!kafkaTopologyProperties.isTopicDefined(topic)) {
                logger.error("❌ 토픽 '{}' 가 kafka-topology.yml에 정의되지 않았습니다.", topic)
                logger.error("")
                logger.error("kafka-topology.yml의 topics 목록에 다음을 추가하세요:")
                logger.error("topics:")
                logger.error("  - name: {}", topic)
                logger.error("    partitions: 3")
                logger.error("    replication-factor: 1")
                logger.error("    description: (토픽 설명)")
                logger.error("    owner: {}", currentServiceName)
                logger.error("")
                System.exit(1)
            }

            if (events.isEmpty()) {
                logger.warn("⚠️  토픽 '{}'에 발행할 이벤트가 하나도 등록되지 않았습니다.", topic)
            }

            logger.info("  - 토픽: {} (정의 ✓)", topic)
            events.forEach { eventType ->
                logger.info("      ✓ {}", eventType)
            }
        }
    }
}
