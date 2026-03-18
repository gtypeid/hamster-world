package com.hamsterworld.notification.app.topology.controller

import com.hamsterworld.notification.app.topology.response.EventRegistryResponse
import com.hamsterworld.notification.app.topology.response.TopologyResponse
import com.hamsterworld.notification.domain.topology.service.EventRegistryReader
import com.hamsterworld.notification.domain.topology.service.TopologyAggregator
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class TopologyController(
    private val eventRegistryReader: EventRegistryReader,
    private val topologyAggregator: TopologyAggregator
) {

    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/internal/event-registry")
    fun getEventRegistry(): EventRegistryResponse {
        return eventRegistryReader.readEventRegistryResponse()
    }

    @PreAuthorize("hasRole('DEVELOPER')")
    @GetMapping("/topology")
    fun getTopology(): TopologyResponse {
        val responses = topologyAggregator.collectTopologyResponse()
        return TopologyResponse(services = responses)
    }
}
