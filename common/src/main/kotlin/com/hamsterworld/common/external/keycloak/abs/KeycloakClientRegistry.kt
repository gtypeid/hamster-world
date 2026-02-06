package com.hamsterworld.common.external.keycloak.abs

import com.hamsterworld.common.web.exception.CustomRuntimeException
import org.springframework.stereotype.Component

/**
 * Keycloak 클라이언트 레지스트리
 *
 * 등록된 Keycloak 클라이언트들을 관리합니다.
 */
@Component
class KeycloakClientRegistry(
    private val clients: List<KeycloakClientProtocol>
) {

    fun <T : KeycloakClientProtocol> getClient(clientClass: Class<T>): T {
        return clients.firstOrNull { clientClass.isInstance(it) }
            ?.let { clientClass.cast(it) }
            ?: throw CustomRuntimeException("Keycloak 클라이언트를 찾을 수 없습니다: ${clientClass.simpleName}")
    }
}
