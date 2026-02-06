package com.hamsterworld.common.web.kafka

import org.springframework.beans.factory.config.BeanPostProcessor
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component

/**
 * EventRegistryProperties Post Processor
 *
 * @ConfigurationProperties 바인딩 후에 placeholder (${...})를 해결하는 후처리기
 *
 * ## 문제
 * - kafka-event-registry.yml에 `${kafka.topics.xxx}` placeholder가 있으면
 * - @ConfigurationProperties가 그대로 문자열로 바인딩 (placeholder 해결 안 됨)
 * - BaseKafkaConsumer가 `@Value("${kafka.topics.xxx}")`로 실제 토픽 이름을 받는데
 * - EventRegistryProperties에는 `"${kafka.topics.xxx}"` 문자열 그대로 저장됨
 * - 결과: 매칭 실패 → UNSUBSCRIBED_EVENT
 *
 * ## 해결
 * - BeanPostProcessor로 EventRegistryProperties bean 생성 후
 * - Environment.resolvePlaceholders()로 모든 토픽 이름의 placeholder 해결
 * - 캐시 초기화
 *
 * ## 실행 시점
 * - postProcessAfterInitialization: Bean 생성 완료 후 (properties 바인딩 완료 후)
 * - Environment는 이미 모든 property source 로드 완료 상태
 */
@Component
@org.springframework.context.annotation.DependsOn("kafkaTopologyPropertyRegistrar")
class EventRegistryPropertiesPostProcessor(
    private val environment: Environment
) : BeanPostProcessor {

    private val logger = org.slf4j.LoggerFactory.getLogger(javaClass)

    init {
        logger.info("========================================")
        logger.info("EventRegistryPropertiesPostProcessor INITIALIZED")
        logger.info("========================================")
    }

    override fun postProcessAfterInitialization(bean: Any, beanName: String): Any {
        logger.debug("postProcessAfterInitialization called for bean: {} (type: {})", beanName, bean.javaClass.simpleName)

        if (bean is EventRegistryProperties) {
            logger.info("========================================")
            logger.info("EventRegistryPropertiesPostProcessor: placeholder 해결 중...")
            logger.info("========================================")

            // Subscribes의 placeholder 해결
            bean.event.subscribes.forEach { subscription ->
                val originalTopic = subscription.topic
                val resolvedTopic = environment.resolvePlaceholders(subscription.topic)
                logger.info("✅ Resolved: {} -> {}", originalTopic, resolvedTopic)
                bean.subscribedEventsCache[resolvedTopic] = subscription.events.toSet()
            }

            // Publishes의 placeholder 해결
            bean.event.publishes.forEach { publication ->
                val originalTopic = publication.topic
                val resolvedTopic = environment.resolvePlaceholders(publication.topic)
                logger.info("✅ Resolved: {} -> {}", originalTopic, resolvedTopic)
                bean.publishedEventsCache[resolvedTopic] = publication.events.toSet()
            }

            logger.info("========================================")
            logger.info("subscribedEventsCache: {}", bean.subscribedEventsCache)
            logger.info("publishedEventsCache: {}", bean.publishedEventsCache)
            logger.info("========================================")
        }
        return bean
    }
}
