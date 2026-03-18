package com.hamsterworld.common.web.kafka
import org.springframework.boot.context.properties.ConfigurationProperties
@ConfigurationProperties(prefix = "")
data class KafkaTopologyProperties(
    val services: List<ServiceDefinition> = emptyList(),
    val topics: List<TopicDefinition> = emptyList()
) {
    data class ServiceDefinition(
        val name: String = "",
        val description: String? = null,
        val owns: List<String> = emptyList()
    )
    data class TopicDefinition(
        val name: String = "",
        val partitions: Int = 1,
        val replicationFactor: Int = 1,
        val description: String? = null,
        val owner: String? = null
    )
    fun isTopicDefined(topicName: String): Boolean {
        return topics.any { it.name == topicName }
    }
    fun isServiceDefined(serviceName: String): Boolean {
        return services.any { it.name == serviceName }
    }
    fun getTopicDefinition(topicName: String): TopicDefinition? {
        return topics.firstOrNull { it.name == topicName }
    }
    fun getOwnedTopicNames(serviceName: String): List<String> {
        return services.firstOrNull { it.name == serviceName }?.owns ?: emptyList()
    }
    fun getPrimaryTopicName(serviceName: String): String? {
        return getOwnedTopicNames(serviceName).firstOrNull()
    }
}
