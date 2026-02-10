package com.hamsterworld.common.web.kafka

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Kafka Event Registry 설정
 *
 * 각 서비스의 kafka-event-registry.yml을 로드하여
 * 구독/발행하는 이벤트를 명시적으로 관리
 *
 * ## 설정 파일 예시
 * ```yaml
 * # cash-gateway-service/src/main/resources/kafka-event-registry.yml
 *
 * event:
 *   subscribes:
 *     - topic: payment-events
 *       events:
 *         - OrderStockReservedEvent
 *
 *   publishes:
 *     - topic: cash-gateway-events
 *       events:
 *         - PaymentApprovedEvent
 *         - PaymentFailedEvent
 *         - PaymentCancelledEvent
 * ```
 *
 * @property event 이벤트 구독/발행 설정
 */
@ConfigurationProperties(prefix = "")
data class EventRegistryProperties(
    val event: EventConfig = EventConfig()
) {
    /**
     * 이벤트 구독/발행 설정
     *
     * @property subscribes 구독하는 토픽과 이벤트 목록
     * @property publishes 발행하는 토픽과 이벤트 목록
     */
    data class EventConfig(
        var subscribes: List<TopicSubscription> = emptyList(),
        var publishes: List<TopicPublication> = emptyList()
    )

    /**
     * 토픽 구독 정보
     *
     * @property topic 구독하는 Kafka 토픽 이름
     * @property events 해당 토픽에서 처리할 이벤트 타입 목록
     */
    data class TopicSubscription(
        val topic: String = "",
        val events: List<String> = emptyList()
    )

    /**
     * 토픽 발행 정보
     *
     * @property topic 발행하는 Kafka 토픽 이름
     * @property events 해당 토픽에 발행하는 이벤트 타입 목록
     */
    data class TopicPublication(
        val topic: String = "",
        val events: List<String> = emptyList()
    )

    /**
     * 특정 토픽에서 구독하는 이벤트 목록 조회
     *
     * @param topic 토픽 이름
     * @return 구독하는 이벤트 타입 Set (없으면 빈 Set)
     */
    fun getSubscribedEvents(topic: String): Set<String> {
        return event.subscribes
            .firstOrNull { it.topic == topic }
            ?.events?.toSet()
            ?: emptySet()
    }

    /**
     * 특정 토픽에 발행하는 이벤트 목록 조회
     *
     * @param topic 토픽 이름
     * @return 발행하는 이벤트 타입 Set (없으면 빈 Set)
     */
    fun getPublishedEvents(topic: String): Set<String> {
        return event.publishes
            .firstOrNull { it.topic == topic }
            ?.events?.toSet()
            ?: emptySet()
    }
}
