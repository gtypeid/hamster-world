package com.hamsterworld.notification.domain.topology.dto

data class EventRegistryDto(
    val serviceName: String,

    val subscribes: List<TopicSubscriptionDto>,

    val publishes: List<TopicPublicationDto>
)

data class TopicSubscriptionDto(
    val topic: String,

    val events: List<String>
)

data class TopicPublicationDto(
    val topic: String,

    val events: List<String>
)
