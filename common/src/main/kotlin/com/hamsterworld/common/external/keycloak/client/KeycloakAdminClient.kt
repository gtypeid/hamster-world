package com.hamsterworld.common.external.keycloak.client
import com.hamsterworld.common.external.keycloak.abs.KeycloakClientProtocolCore
import com.hamsterworld.common.external.keycloak.properties.KeycloakProperties
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
@Component
class KeycloakAdminClient(
    properties: KeycloakProperties,
    @Qualifier("keycloakRestTemplate")
    restTemplate: RestTemplate
) : KeycloakClientProtocolCore(properties, restTemplate) {
    override fun getClientName(): String = "KeycloakAdminClient"
}
