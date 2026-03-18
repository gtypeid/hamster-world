package com.hamsterworld.common.web.config
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer
@Configuration
class CommonSecurityConfig {
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
