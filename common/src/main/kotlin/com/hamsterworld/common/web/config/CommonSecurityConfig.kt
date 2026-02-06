package com.hamsterworld.common.web.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer

/**
 * 공통 Security 설정
 * 모든 서비스에서 공통으로 사용하는 인프라 경로를 Security 필터에서 제외
 */
@Configuration
class CommonSecurityConfig {

    /**
     * 인프라 경로는 Security 필터를 완전히 무시 (성능 최적화)
     * - Spring Security 필터 체인 자체를 타지 않음
     * - Actuator, Swagger, 정적 리소스 등 인증이 필요 없는 인프라 경로
     */
    @Bean
    fun webSecurityCustomizer(): WebSecurityCustomizer {
        return WebSecurityCustomizer { web ->
            web.ignoring()
                .requestMatchers("/actuator/**")
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**")
                .requestMatchers("/favicon.ico", "/error")
        }
    }
}
