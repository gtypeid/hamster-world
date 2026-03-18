package com.hamsterworld.notification.domain.topology.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.readValue
import com.hamsterworld.notification.domain.topology.dto.EventRegistryDto
import com.hamsterworld.notification.domain.topology.dto.TopicPublicationDto
import com.hamsterworld.notification.domain.topology.dto.TopicSubscriptionDto
import com.hamsterworld.notification.app.topology.response.EventRegistryResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class EventRegistryReader(
    @Value("\${spring.application.name}") private val serviceName: String
) {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val yamlMapper = ObjectMapper(YAMLFactory()).apply {
        findAndRegisterModules()
    }

    fun readEventRegistry(): EventRegistryDto {
        return try {
            val resource = ClassPathResource("kafka-event-registry.yml")

            if (!resource.exists()) {
                logger.warn("kafka-event-registry.yml not found in classpath")
                return EventRegistryDto(
                    serviceName = serviceName,
                    subscribes = emptyList(),
                    publishes = emptyList()
                )
            }

            val yamlContent = resource.inputStream.use { inputStream ->
                yamlMapper.readValue<Map<String, Any>>(inputStream)
            }

            parseEventRegistry(yamlContent)

        } catch (e: Exception) {
            logger.error("Failed to read kafka-event-registry.yml", e)
            throw IllegalStateException("Failed to read kafka-event-registry.yml", e)
        }
    }

    fun readEventRegistryResponse(): EventRegistryResponse {
        val dto = readEventRegistry()
        return EventRegistryResponse.from(dto)
    }

    private fun parseEventRegistry(yamlContent: Map<String, Any>): EventRegistryDto {
        @Suppress("UNCHECKED_CAST")
        val eventSection = yamlContent["event"] as? Map<String, Any>
            ?: return EventRegistryDto(serviceName, emptyList(), emptyList())

        val subscribes = parseTopicList(eventSection["subscribes"] as? List<Map<String, Any>>)
        val publishes = parseTopicList(eventSection["publishes"] as? List<Map<String, Any>>)

        return EventRegistryDto(
            serviceName = serviceName,
            subscribes = subscribes.map { TopicSubscriptionDto(it.topic, it.events) },
            publishes = publishes.map { TopicPublicationDto(it.topic, it.events) }
        )
    }

    private fun parseTopicList(topicList: List<Map<String, Any>>?): List<TopicEntry> {
        if (topicList == null) return emptyList()

        return topicList.mapNotNull { topicMap ->
            val topic = topicMap["topic"] as? String ?: return@mapNotNull null
            @Suppress("UNCHECKED_CAST")
            val events = (topicMap["events"] as? List<String>) ?: emptyList()

            TopicEntry(topic, events)
        }
    }

    private data class TopicEntry(
        val topic: String,
        val events: List<String>
    )
}
