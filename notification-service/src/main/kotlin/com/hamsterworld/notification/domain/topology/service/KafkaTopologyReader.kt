package com.hamsterworld.notification.domain.topology.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.readValue
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

/**
 * Kafka Topology Reader
 *
 * classpath:kafka-topology.yml 파일을 읽어서 전체 시스템의 서비스 목록을 가져옵니다.
 * 이 파일은 common 모듈에 정의되어 있으며, 모든 서비스와 토픽의 정의를 포함합니다.
 */
@Component
class KafkaTopologyReader {
    private val logger = LoggerFactory.getLogger(javaClass)
    private val yamlMapper = ObjectMapper(YAMLFactory()).apply {
        findAndRegisterModules()
    }

    /**
     * kafka-topology.yml에서 서비스 목록 읽기
     *
     * @return List<String> 서비스명 목록
     */
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

    /**
     * YAML Map에서 서비스 이름 목록 추출
     */
    private fun parseServiceNames(yamlContent: Map<String, Any>): List<String> {
        @Suppress("UNCHECKED_CAST")
        val services = yamlContent["services"] as? List<Map<String, Any>>
            ?: return emptyList()

        return services.mapNotNull { serviceMap ->
            serviceMap["name"] as? String
        }
    }
}
