package com.hamsterworld.common.external.keycloak.client

import com.hamsterworld.common.external.keycloak.abs.KeycloakClientProtocolCore
import com.hamsterworld.common.external.keycloak.properties.KeycloakProperties
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

/**
 * Keycloak Admin API 클라이언트 구현체
 *
 * 실제 Keycloak Admin API를 호출하는 클라이언트입니다.
 *
 * ## RestTemplate 주입
 * - `keycloakRestTemplate` Bean을 명시적으로 주입
 * - 다른 서비스의 RestTemplate Bean과 충돌하지 않음
 */
@Component
class KeycloakAdminClient(
    properties: KeycloakProperties,
    @Qualifier("keycloakRestTemplate")
    restTemplate: RestTemplate
) : KeycloakClientProtocolCore(properties, restTemplate) {

    override fun getClientName(): String = "KeycloakAdminClient"
}
