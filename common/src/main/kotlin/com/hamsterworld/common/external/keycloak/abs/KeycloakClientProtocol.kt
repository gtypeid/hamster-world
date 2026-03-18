package com.hamsterworld.common.external.keycloak.abs
import com.hamsterworld.common.external.ExternalClientProtocol
interface KeycloakClientProtocol : ExternalClientProtocol {
    fun createUser(
        username: String,
        email: String,
        password: String,
        name: String
    ): String
    fun assignRealmRole(userId: String, roleName: String)
    fun deleteUser(userId: String)
    fun getUser(userId: String): Map<String, Any>?
    fun setUserEnabled(userId: String, enabled: Boolean)
}
