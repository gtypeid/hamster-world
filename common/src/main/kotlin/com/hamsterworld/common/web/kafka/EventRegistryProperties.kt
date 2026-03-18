package com.hamsterworld.common.web.kafka
import org.springframework.boot.context.properties.ConfigurationProperties
@ConfigurationProperties(prefix = "")
data class EventRegistryProperties(
    val event: EventConfig = EventConfig()
) {
    data class EventConfig(
        var subscribes: List<TopicSubscription> = emptyList(),
        var publishes: List<TopicPublication> = emptyList()
    )
    data class TopicSubscription(
        val topic: String = "",
        val events: List<String> = emptyList()
    )
    data class TopicPublication(
        val topic: String = "",
        val events: List<String> = emptyList()
    )
    fun getSubscribedEvents(topic: String): Set<String> {
        return event.subscribes
            .firstOrNull { it.topic == topic }
            ?.events?.toSet()
            ?: emptySet()
    }
    fun getPublishedEvents(topic: String): Set<String> {
        return event.publishes
            .firstOrNull { it.topic == topic }
            ?.events?.toSet()
            ?: emptySet()
    }
}
