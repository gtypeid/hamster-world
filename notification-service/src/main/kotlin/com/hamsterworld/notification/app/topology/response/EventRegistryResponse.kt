package com.hamsterworld.notification.app.topology.response

import com.hamsterworld.notification.domain.topology.dto.EventRegistryDto
import com.hamsterworld.notification.domain.topology.dto.TopicPublicationDto
import com.hamsterworld.notification.domain.topology.dto.TopicSubscriptionDto

data class EventRegistryResponse(
    val serviceName: String,

    val subscribes: List<TopicSubscription>,

    val publishes: List<TopicPublication>
) {
    companion object {
        fun from(dto: EventRegistryDto): EventRegistryResponse {
            return EventRegistryResponse(
                serviceName = dto.serviceName,
                subscribes = dto.subscribes.map { TopicSubscription.from(it) },
                publishes = dto.publishes.map { TopicPublication.from(it) }
            )
        }
    }
}

data class TopicSubscription(
    val topic: String,

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

data class TopicPublication(
    val topic: String,

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
