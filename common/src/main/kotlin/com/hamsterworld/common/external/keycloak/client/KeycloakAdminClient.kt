package com.hamsterworld.common.external.keycloak.client

import com.hamsterworld.common.external.keycloak.abs.KeycloakClientProtocolCore
import com.hamsterworld.common.external.keycloak.properties.KeycloakProperties
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

/**
 * Keycloak Admin API 클라이언트 구현체
 *
 * 실제 Keycloak Admin API를 호출하는 클라이언트입니다.
 */
@Component
class KeycloakAdminClient(
    properties: KeycloakProperties,
    restTemplate: RestTemplate
) : KeycloakClientProtocolCore(properties, restTemplate) {

    override fun getClientName(): String = "KeycloakAdminClient"
}
