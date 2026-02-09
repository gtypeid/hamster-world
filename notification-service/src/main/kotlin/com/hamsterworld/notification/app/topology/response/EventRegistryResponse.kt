package com.hamsterworld.notification.app.topology.response

import com.hamsterworld.notification.domain.topology.dto.EventRegistryDto
import com.hamsterworld.notification.domain.topology.dto.TopicPublicationDto
import com.hamsterworld.notification.domain.topology.dto.TopicSubscriptionDto

/**
 * Event Registry Response (Presentation Layer)
 *
 * GET /api/internal/event-registry 응답 DTO
 */
data class EventRegistryResponse(
    /**
     * 서비스명
     */
    val serviceName: String,

    /**
     * 구독하는 이벤트 목록
     */
    val subscribes: List<TopicSubscription>,

    /**
     * 발행하는 이벤트 목록
     */
    val publishes: List<TopicPublication>
) {
    companion object {
        /**
         * Domain DTO → Response DTO 변환
         */
        fun from(dto: EventRegistryDto): EventRegistryResponse {
            return EventRegistryResponse(
                serviceName = dto.serviceName,
                subscribes = dto.subscribes.map { TopicSubscription.from(it) },
                publishes = dto.publishes.map { TopicPublication.from(it) }
            )
        }
    }
}

/**
 * 토픽 구독 정보
 */
data class TopicSubscription(
    /**
     * 구독하는 토픽 이름
     */
    val topic: String,

    /**
     * 구독하는 이벤트 타입 목록
     * 빈 배열인 경우 모든 이벤트 수신 (DLT 토픽)
     */
    val events: List<String>
) {
    companion object {
        fun from(dto: TopicSubscriptionDto): TopicSubscription {
            return TopicSubscription(
                topic = dto.topic,
                events = dto.events
            )
        }
    }
}

/**
 * 토픽 발행 정보
 */
data class TopicPublication(
    /**
     * 발행하는 토픽 이름
     */
    val topic: String,

    /**
     * 발행하는 이벤트 타입 목록
     */
    val events: List<String>
) {
    companion object {
        fun from(dto: TopicPublicationDto): TopicPublication {
            return TopicPublication(
                topic = dto.topic,
                events = dto.events
            )
        }
    }
}
