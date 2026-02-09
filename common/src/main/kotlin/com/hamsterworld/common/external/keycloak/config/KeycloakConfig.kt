package com.hamsterworld.common.external.keycloak.config

import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestTemplate
import java.time.Duration

/**
 * Keycloak Configuration
 *
 * Keycloak Admin API 호출용 전용 RestTemplate을 제공합니다.
 *
 * ## 왜 별도의 RestTemplate인가?
 * - 각 서비스가 자체 RestTemplate Bean을 가질 수 있음
 * - Keycloak 전용 설정 (timeout 등) 독립적으로 관리
 * - Bean 이름 충돌 방지
 */
@Configuration
class KeycloakConfig {

    /**
     * Keycloak Admin API 전용 RestTemplate
     *
     * Bean 이름: keycloakRestTemplate (함수명)
     *
     * @Qualifier로 명시적으로 주입받아 사용:
     * ```kotlin
     * @Qualifier("keycloakRestTemplate")
     * restTemplate: RestTemplate
     * ```
     */
    @Bean
    fun keycloakRestTemplate(builder: RestTemplateBuilder): RestTemplate {
        return builder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(10))
            .build()
    }
}
