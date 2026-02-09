package com.hamsterworld.notification.domain.topology.service

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient
import java.time.Duration

/**
 * RestClient Configuration
 *
 * 다른 서비스의 API를 호출하기 위한 RestClient 설정
 */
@Configuration
class RestClientConfig {

    @Bean
    fun restClient(): RestClient {
        return RestClient.builder()
            .build()
    }
}
