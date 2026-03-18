package com.hamsterworld.notification.domain.topology.service

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient
import java.time.Duration

@Configuration
class RestClientConfig {

    @Bean
    fun restClient(): RestClient {
        return RestClient.builder()
            .build()
    }
}
