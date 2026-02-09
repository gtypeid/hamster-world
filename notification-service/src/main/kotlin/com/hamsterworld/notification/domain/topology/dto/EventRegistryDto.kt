package com.hamsterworld.notification.domain.topology.dto

/**
 * Event Registry DTO (Domain Layer)
 *
 * 각 서비스의 kafka-event-registry.yml 내용을 표현하는 도메인 DTO입니다.
 */
data class EventRegistryDto(
    /**
     * 서비스명
     * spring.application.name에서 자동으로 설정됩니다.
     */
    val serviceName: String,

    /**
     * 구독하는 이벤트 목록
     */
    val subscribes: List<TopicSubscriptionDto>,

    /**
     * 발행하는 이벤트 목록
     */
    val publishes: List<TopicPublicationDto>
)

/**
 * 토픽 구독 정보
 */
data class TopicSubscriptionDto(
    /**
     * 구독하는 토픽 이름
     * 예: "ecommerce-events", "payment-events"
     */
    val topic: String,

    /**
     * 구독하는 이벤트 타입 목록
     * 예: ["ProductCreatedEvent", "OrderCreatedEvent"]
     * 빈 배열인 경우 모든 이벤트 수신 (DLT 토픽의 경우)
     */
    val events: List<String>
)

/**
 * 토픽 발행 정보
 */
data class TopicPublicationDto(
    /**
     * 발행하는 토픽 이름
     * 예: "ecommerce-events", "payment-events"
     */
    val topic: String,

    /**
     * 발행하는 이벤트 타입 목록
     * 예: ["ProductCreatedEvent", "OrderCreatedEvent"]
     */
    val events: List<String>
)
