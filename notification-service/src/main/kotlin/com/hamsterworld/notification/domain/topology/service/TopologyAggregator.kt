package com.hamsterworld.notification.domain.topology.service

import com.hamsterworld.notification.domain.topology.dto.EventRegistryDto
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

/**
 * Topology Aggregator
 *
 * 모든 서비스의 Event Registry를 수집하여 전체 Kafka 토폴로지를 구성합니다.
 *
 * ## 동작 방식:
 * 1. kafka-topology.yml에서 전체 서비스 목록 읽기
 * 2. application.yml의 topology.url-mappings에서 각 서비스의 URL 조회
 * 3. 각 서비스의 GET /api/internal/event-registry 호출
 * 4. 수집한 정보를 통합하여 반환
 *
 * ## 장점:
 * - kafka-topology.yml을 Single Source of Truth로 사용
 * - URL 매핑만 환경별로 설정 (서비스 목록은 자동 동기화)
 *
 * ## 환경별 URL 매핑:
 * - application.yml (local): localhost:{port}
 * - application-k8s.yml: http://{service-name} (K8s Service DNS)
 */
@Component
class TopologyAggregator(
    private val kafkaTopologyReader: KafkaTopologyReader,
    private val topologyProperties: TopologyProperties,
    private val restClient: RestClient
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * 전체 토폴로지 수집
     *
     * kafka-topology.yml의 서비스 목록을 기반으로 각 서비스의 Event Registry를 수집합니다.
     * 일부 서비스 호출 실패 시에도 나머지는 반환합니다.
     *
     * @return List<EventRegistryDto>
     */
    fun collectTopology(): List<EventRegistryDto> {
        // kafka-topology.yml에서 서비스 목록 읽기
        val serviceNames = kafkaTopologyReader.readServiceNames()
        logger.info("Collecting topology from {} services (from kafka-topology.yml)", serviceNames.size)

        return serviceNames.mapNotNull { serviceName ->
            // URL 매핑 조회
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

    /**
     * 특정 서비스의 Event Registry 조회
     */
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

/**
 * Topology Properties
 *
 * application.yml의 topology.url-mappings 설정을 바인딩합니다.
 *
 * ## 설정 예시:
 * ```yaml
 * topology:
 *   url-mappings:
 *     ecommerce-service: http://localhost:8080
 *     payment-service: http://localhost:8081
 *     cash-gateway-service: http://localhost:8082
 *     progression-service: http://localhost:8083
 *     notification-service: http://localhost:8085
 * ```
 *
 * ## 장점:
 * - 서비스 목록은 kafka-topology.yml에서 자동으로 가져옴
 * - URL 매핑만 환경별로 설정 (local, k8s 등)
 * - 새로운 서비스 추가 시 kafka-topology.yml만 수정하면 자동 반영
 */
@Component
@ConfigurationProperties(prefix = "topology")
data class TopologyProperties(
    /**
     * 서비스명 → URL 매핑
     *
     * Key: 서비스명 (kafka-topology.yml의 service.name과 동일)
     * Value: 서비스 Base URL
     */
    var urlMappings: Map<String, String> = emptyMap()
)
