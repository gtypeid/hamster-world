package com.hamsterworld.common.external.keycloak.abs

import com.hamsterworld.common.external.ExternalClientProtocol

/**
 * Keycloak 클라이언트 프로토콜
 *
 * Keycloak Admin API와의 통신을 담당합니다.
 */
interface KeycloakClientProtocol : ExternalClientProtocol {

    /**
     * Keycloak에 사용자 생성
     * @return Keycloak User ID (UUID)
     */
    fun createUser(
        username: String,
        email: String,
        password: String,
        name: String
    ): String

    /**
     * Keycloak 사용자에게 Realm Role 할당
     */
    fun assignRealmRole(userId: String, roleName: String)

    /**
     * Keycloak 사용자 삭제
     */
    fun deleteUser(userId: String)

    /**
     * Keycloak 사용자 정보 조회
     */
    fun getUser(userId: String): Map<String, Any>?

    /**
     * Keycloak 사용자 비활성화/활성화
     */
    fun setUserEnabled(userId: String, enabled: Boolean)
}
