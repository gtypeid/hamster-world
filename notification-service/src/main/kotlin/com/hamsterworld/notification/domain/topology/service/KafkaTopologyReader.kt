package com.hamsterworld.notification.domain.topology.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.readValue
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class KafkaTopologyReader {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val yamlMapper = ObjectMapper(YAMLFactory()).apply {
        findAndRegisterModules()
    }

    fun readServiceNames(): List<String> {
        return try {
            val resource = ClassPathResource("kafka-topology.yml")

            if (!resource.exists()) {
                logger.error("kafka-topology.yml not found in classpath")
                return emptyList()
            }

            val yamlContent = resource.inputStream.use { inputStream ->
                yamlMapper.readValue<Map<String, Any>>(inputStream)
            }

            parseServiceNames(yamlContent)

        } catch (e: Exception) {
            logger.error("Failed to read kafka-topology.yml", e)
            emptyList()
        }
    }

    private fun parseServiceNames(yamlContent: Map<String, Any>): List<String> {
        @Suppress("UNCHECKED_CAST")
        val services = yamlContent["services"] as? List<Map<String, Any>>
            ?: return emptyList()

        return services.mapNotNull { serviceMap ->
            serviceMap["name"] as? String
        }
    }
}
