package com.hamsterworld.common.web.kafka

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Kafka Topology 설정
 *
 * kafka-topology.yml을 로드하여 전체 시스템의 서비스 및 토픽을 관리합니다.
 * 이 설정은 인프라 레벨의 중앙 집중식 정의로, 모든 서비스가 참조합니다.
 *
 * ## 설정 파일 예시
 * ```yaml
 * # common/src/main/resources/kafka-topology.yml
 * services:
 *   - name: ecommerce-service
 *     description: E-commerce 서비스
 *
 * topics:
 *   - name: ecommerce-events
 *     partitions: 3
 *     replication-factor: 1
 *     description: E-commerce Service 이벤트
 *     owner: ecommerce-service
 * ```
 *
 * ## 용도
 * 1. **토픽 검증**: kafka-event-registry.yml에서 참조하는 토픽이 실제로 존재하는지 검증
 * 2. **서비스 검증**: spring.application.name이 시스템에 정의된 서비스인지 검증
 * 3. **토픽 자동 생성** (선택적): kafka-topology.yml 기반으로 Kafka 토픽 자동 생성
 * 4. **문서화**: 전체 시스템의 서비스 및 토픽 구조를 한눈에 파악
 *
 * @property services 시스템에 존재하는 모든 서비스 목록
 * @property topics Kafka 토픽 목록 (파티션, 복제 팩터, 소유자 포함)
 */
@ConfigurationProperties(prefix = "")
data class KafkaTopologyProperties(
    val services: List<ServiceDefinition> = emptyList(),
    val topics: List<TopicDefinition> = emptyList()
) {
    /**
     * 서비스 정의
     *
     * @property name 서비스 이름 (spring.application.name과 일치해야 함)
     * @property description 서비스 설명
     * @property owns 이 서비스가 소유한 토픽 목록 (발행하는 토픽)
     */
    data class ServiceDefinition(
        val name: String = "",
        val description: String? = null,
        val owns: List<String> = emptyList()
    )

    /**
     * 토픽 정의
     *
     * @property name Kafka 토픽 이름
     * @property partitions 파티션 수 (기본값: 1)
     * @property replicationFactor 복제 팩터 (기본값: 1)
     * @property description 토픽 설명
     * @property owner 토픽을 소유한 서비스 (이벤트를 발행하는 주체)
     */
    data class TopicDefinition(
        val name: String = "",
        val partitions: Int = 1,
        val replicationFactor: Int = 1,
        val description: String? = null,
        val owner: String? = null
    )

    /**
     * 특정 토픽이 kafka-topology.yml에 정의되어 있는지 검증
     *
     * @param topicName 검증할 토픽 이름
     * @return 존재하면 true, 아니면 false
     */
    fun isTopicDefined(topicName: String): Boolean {
        return topics.any { it.name == topicName }
    }

    /**
     * 특정 서비스가 kafka-topology.yml에 정의되어 있는지 검증
     *
     * @param serviceName 검증할 서비스 이름
     * @return 존재하면 true, 아니면 false
     */
    fun isServiceDefined(serviceName: String): Boolean {
        return services.any { it.name == serviceName }
    }

    /**
     * 토픽 정의 조회
     *
     * @param topicName 토픽 이름
     * @return 토픽 정의 (없으면 null)
     */
    fun getTopicDefinition(topicName: String): TopicDefinition? {
        return topics.firstOrNull { it.name == topicName }
    }

    /**
     * 특정 서비스가 소유한 토픽 이름 목록 조회
     *
     * @param serviceName 서비스 이름
     * @return 해당 서비스가 소유한 토픽 이름 목록
     */
    fun getOwnedTopicNames(serviceName: String): List<String> {
        return services.firstOrNull { it.name == serviceName }?.owns ?: emptyList()
    }

    /**
     * 특정 서비스의 첫 번째 소유 토픽 조회
     *
     * 대부분의 서비스는 1개의 토픽만 소유하므로, 첫 번째 토픽을 반환합니다.
     *
     * @param serviceName 서비스 이름
     * @return 첫 번째 소유 토픽 이름 (없으면 null)
     */
    fun getPrimaryTopicName(serviceName: String): String? {
        return getOwnedTopicNames(serviceName).firstOrNull()
    }
}
