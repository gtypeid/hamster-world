package com.hamsterworld.notification.app.topology.controller

import com.hamsterworld.notification.app.topology.response.EventRegistryResponse
import com.hamsterworld.notification.app.topology.response.TopologyResponse
import com.hamsterworld.notification.domain.topology.service.EventRegistryReader
import com.hamsterworld.notification.domain.topology.service.TopologyAggregator
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Topology Controller
 *
 * Kafka 토폴로지 관련 API를 제공합니다.
 * DEVELOPER 이상의 권한이 필요합니다.
 *
 * ## 엔드포인트
 * - GET /api/internal/event-registry - 이 서비스(notification-service)의 event-registry
 * - GET /api/topology - 전체 시스템의 Kafka 토폴로지 (모든 서비스 통합)
 *
 * ## 권한 제어
 * - @PreAuthorize("hasRole('DEVELOPER')") 적용
 * - RoleHierarchy에 의해 DEVELOPER, SYSTEM만 접근 가능
 */
@RestController
@RequestMapping("/api")
class TopologyController(
    private val eventRegistryReader: EventRegistryReader,
    private val topologyAggregator: TopologyAggregator
) {

    /**
     * 이 서비스의 Event Registry 조회
     *
     * notification-service의 kafka-event-registry.yml 내용을 반환합니다.
     *
     * @return EventRegistryResponse
     */
    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/internal/event-registry")
    fun getEventRegistry(): EventRegistryResponse {
        val dto = eventRegistryReader.readEventRegistry()
        return EventRegistryResponse.from(dto)
    }

    /**
     * 전체 토폴로지 조회
     *
     * 모든 서비스의 event-registry를 수집하여 통합된 토폴로지를 반환합니다.
     * 프론트엔드에서 전체 Kafka 이벤트 흐름을 시각화할 때 사용됩니다.
     *
     * ## 동작 방식:
     * 1. application.yml의 topology.services 목록에서 각 서비스 URL 획득
     * 2. 각 서비스의 GET /api/internal/event-registry 호출
     * 3. 수집한 모든 정보를 통합하여 반환
     *
     * ## 환경별 서비스 URL:
     * - Local: http://localhost:8080, http://localhost:8081, ...
     * - K8s: http://ecommerce-service, http://payment-service, ...
     *
     * @return TopologyResponse
     */
    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/topology")
    fun getTopology(): TopologyResponse {
        val allRegistries = topologyAggregator.collectTopology()
        val responses = allRegistries.map { EventRegistryResponse.from(it) }
        return TopologyResponse(services = responses)
    }
}
