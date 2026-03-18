package com.hamsterworld.notification.domain.topology.service

import com.hamsterworld.notification.domain.topology.dto.EventRegistryDto
import com.hamsterworld.notification.app.topology.response.EventRegistryResponse
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

@Component
class TopologyAggregator(
    private val kafkaTopologyReader: KafkaTopologyReader,
    private val topologyProperties: TopologyProperties,
    private val restClient: RestClient
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun collectTopology(): List<EventRegistryDto> {
        val serviceNames = kafkaTopologyReader.readServiceNames()
        logger.info("Collecting topology from {} services (from kafka-topology.yml)", serviceNames.size)

        return serviceNames.mapNotNull { serviceName ->
            val url = topologyProperties.urlMappings[serviceName]
            if (url == null) {
                logger.warn("No URL mapping found for service: {}", serviceName)
                return@mapNotNull null
            }

            try {
                fetchEventRegistry(serviceName, url)
            } catch (e: Exception) {
                logger.warn(
                    "Failed to fetch event-registry from {}: {}",
                    serviceName, e.message
                )
                null
            }
        }
    }

    fun collectTopologyResponse(): List<EventRegistryResponse> {
        val allRegistries = collectTopology()
        return allRegistries.map { EventRegistryResponse.from(it) }
    }

    private fun fetchEventRegistry(serviceName: String, baseUrl: String): EventRegistryDto {
        val url = "$baseUrl/api/internal/event-registry"

        logger.debug("Fetching event-registry from: {}", url)

        return try {
            restClient.get()
                .uri(url)
                .retrieve()
                .body(EventRegistryDto::class.java)
                ?: throw IllegalStateException("Empty response from $url")

        } catch (e: RestClientException) {
            logger.error("RestClient error for {}: {}", serviceName, e.message)
            throw e
        }
    }
}

@Component
@ConfigurationProperties(prefix = "topology")
data class TopologyProperties(
    var urlMappings: Map<String, String> = emptyMap()
)
