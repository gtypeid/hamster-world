package com.hamsterworld.common.external.keycloak.client

import com.hamsterworld.common.external.keycloak.abs.KeycloakClientProtocol
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.util.UUID

/**
 * Keycloak Dummy 클라이언트
 *
 * 로컬 개발/테스트 환경에서 실제 Keycloak 없이 동작하도록 합니다.
 */
@Component
@Profile("dummy")
class DummyKeycloakClient : KeycloakClientProtocol {

    private val log = LoggerFactory.getLogger(javaClass)
    private val users = mutableMapOf<String, Map<String, Any>>()

    override fun createUser(
        username: String,
        email: String,
        password: String,
        name: String
    ): String {
        val userId = UUID.randomUUID().toString()
        users[userId] = mapOf(
            "id" to userId,
            "username" to username,
            "email" to email,
            "name" to name,
            "enabled" to true
        )
        log.info("[DUMMY] Created user: $username (ID: $userId)")
        return userId
    }

    override fun assignRealmRole(userId: String, roleName: String) {
        log.info("[DUMMY] Assigned role '$roleName' to user $userId")
    }

    override fun deleteUser(userId: String) {
        users.remove(userId)
        log.info("[DUMMY] Deleted user $userId")
    }

    override fun getUser(userId: String): Map<String, Any>? {
        return users[userId]
    }

    override fun setUserEnabled(userId: String, enabled: Boolean) {
        log.info("[DUMMY] Set user $userId enabled: $enabled")
    }

    override fun getClientName(): String = "DummyKeycloakClient"
}
