package com.hamsterworld.notification.app.topology.response

/**
 * Topology Response
 *
 * 전체 Kafka 토폴로지 정보
 */
data class TopologyResponse(
    /**
     * 모든 서비스의 Event Registry 목록
     */
    val services: List<EventRegistryResponse>
)
