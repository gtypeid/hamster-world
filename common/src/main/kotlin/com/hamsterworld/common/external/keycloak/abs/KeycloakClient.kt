package com.hamsterworld.common.external.keycloak.abs

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

/**
 * Keycloak 클라이언트 Facade
 *
 * 실제 사용할 Keycloak 클라이언트를 바인딩하고 위임합니다.
 */
@Component
class KeycloakClient(
    private val registry: KeycloakClientRegistry
) {

    private val log = LoggerFactory.getLogger(javaClass)

    fun <T : KeycloakClientProtocol> bind(clientClass: Class<T>): KeycloakClientProtocol {
        val delegate = registry.getClient(clientClass)
        return KeycloakClientRunner(delegate)
    }

    /**
     * Inner Runner
     * 실제 클라이언트 호출을 래핑하여 로깅, 에러 핸들링 등 공통 처리를 수행합니다.
     */
    private class KeycloakClientRunner(
        private val delegate: KeycloakClientProtocol
    ) : KeycloakClientProtocol {

        private val log = LoggerFactory.getLogger(javaClass)

        override fun createUser(
            username: String,
            email: String,
            password: String,
            name: String
        ): String {
            log.info("[{}] Creating user: {}", delegate.getClientName(), username)
            return delegate.createUser(username, email, password, name)
        }

        override fun assignRealmRole(userId: String, roleName: String) {
            log.info("[{}] Assigning role '{}' to user {}", delegate.getClientName(), roleName, userId)
            delegate.assignRealmRole(userId, roleName)
        }

        override fun deleteUser(userId: String) {
            log.info("[{}] Deleting user {}", delegate.getClientName(), userId)
            delegate.deleteUser(userId)
        }

        override fun getUser(userId: String): Map<String, Any>? {
            log.debug("[{}] Getting user {}", delegate.getClientName(), userId)
            return delegate.getUser(userId)
        }

        override fun setUserEnabled(userId: String, enabled: Boolean) {
            log.info("[{}] Setting user {} enabled: {}", delegate.getClientName(), userId, enabled)
            delegate.setUserEnabled(userId, enabled)
        }

        override fun getClientName(): String = delegate.getClientName()
    }
}
