package com.hamsterworld.common.external.keycloak.properties

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

/**
 * Keycloak 설정 프로퍼티
 *
 * 각 서비스의 application.yml에서 keycloak 섹션을 읽어옵니다.
 */
@Component
@ConfigurationProperties(prefix = "keycloak")
data class KeycloakProperties(
    var serverUrl: String = "http://localhost:8090",
    var realm: String = "hamster-world",
    var admin: AdminConfig = AdminConfig()
) {
    data class AdminConfig(
        var username: String = "admin",
        var password: String = "admin",
        var clientId: String = "admin-cli"
    )
}
