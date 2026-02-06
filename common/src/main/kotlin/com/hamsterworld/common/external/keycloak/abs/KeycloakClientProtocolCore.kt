package com.hamsterworld.common.external.keycloak.abs

import com.hamsterworld.common.external.keycloak.properties.KeycloakProperties
import org.slf4j.LoggerFactory
import org.springframework.http.*
import org.springframework.web.client.RestTemplate

/**
 * Keycloak 클라이언트 프로토콜 핵심 구현
 *
 * Keycloak Admin API 호출의 공통 로직을 제공합니다.
 */
abstract class KeycloakClientProtocolCore(
    protected val properties: KeycloakProperties,
    protected val restTemplate: RestTemplate
) : KeycloakClientProtocol {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun createUser(
        username: String,
        email: String,
        password: String,
        name: String
    ): String {
        val accessToken = getAdminAccessToken()

        val userRepresentation = mapOf(
            "username" to username,
            "email" to email,
            "firstName" to name,  // Keycloak은 firstName, lastName으로 분리
            "lastName" to "",
            "enabled" to true,
            "emailVerified" to true,
            "credentials" to listOf(
                mapOf(
                    "type" to "password",
                    "value" to password,
                    "temporary" to false
                )
            )
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(accessToken)
        }

        val request = HttpEntity(userRepresentation, headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/users"

        val response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            String::class.java
        )

        // Location 헤더에서 User ID 추출
        val locationHeader = response.headers.location?.toString()
            ?: throw IllegalStateException("Failed to create user in Keycloak")

        return locationHeader.substringAfterLast("/")
    }

    override fun assignRealmRole(userId: String, roleName: String) {
        val accessToken = getAdminAccessToken()

        // 1. Role ID 조회
        val roleId = getRealmRoleId(roleName, accessToken)

        // 2. Role 할당
        val roleRepresentation = listOf(
            mapOf(
                "id" to roleId,
                "name" to roleName
            )
        )

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(accessToken)
        }

        val request = HttpEntity(roleRepresentation, headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/users/$userId/role-mappings/realm"

        restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            String::class.java
        )
    }

    override fun deleteUser(userId: String) {
        val accessToken = getAdminAccessToken()

        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }

        val request = HttpEntity<Void>(headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/users/$userId"

        restTemplate.exchange(
            url,
            HttpMethod.DELETE,
            request,
            String::class.java
        )
    }

    override fun getUser(userId: String): Map<String, Any>? {
        val accessToken = getAdminAccessToken()

        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }

        val request = HttpEntity<Void>(headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/users/$userId"

        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            request,
            Map::class.java
        )

        @Suppress("UNCHECKED_CAST")
        return response.body as? Map<String, Any>
    }

    override fun setUserEnabled(userId: String, enabled: Boolean) {
        val accessToken = getAdminAccessToken()

        val userUpdate = mapOf("enabled" to enabled)

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(accessToken)
        }

        val request = HttpEntity(userUpdate, headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/users/$userId"

        restTemplate.exchange(
            url,
            HttpMethod.PUT,
            request,
            String::class.java
        )
    }

    /**
     * Admin Access Token 획득
     */
    protected fun getAdminAccessToken(): String {
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_FORM_URLENCODED
        }

        val body = "grant_type=password" +
                "&client_id=${properties.admin.clientId}" +
                "&username=${properties.admin.username}" +
                "&password=${properties.admin.password}"

        val request = HttpEntity(body, headers)
        val url = "${properties.serverUrl}/realms/master/protocol/openid-connect/token"

        val response = restTemplate.exchange(
            url,
            HttpMethod.POST,
            request,
            Map::class.java
        )

        return response.body?.get("access_token") as? String
            ?: throw IllegalStateException("Failed to get admin access token")
    }

    /**
     * Realm Role ID 조회
     */
    protected fun getRealmRoleId(roleName: String, accessToken: String): String {
        val headers = HttpHeaders().apply {
            setBearerAuth(accessToken)
        }

        val request = HttpEntity<Void>(headers)
        val url = "${properties.serverUrl}/admin/realms/${properties.realm}/roles/$roleName"

        val response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            request,
            Map::class.java
        )

        return response.body?.get("id") as? String
            ?: throw IllegalStateException("Failed to get role ID for $roleName")
    }
}
