package com.hamsterworld.ecommerce.domain.user.model

import com.hamsterworld.common.domain.abs.AbsDomain
import com.hamsterworld.common.domain.auth.UserRole
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.springframework.security.oauth2.jwt.Jwt

@Entity
@Table(
    name = "users",
    indexes = [
        Index(name = "idx_users_public_id", columnList = "public_id", unique = true),
        Index(name = "idx_users_keycloak_user_id", columnList = "keycloak_user_id", unique = true)
    ]
)
class User(
    @Column(name = "keycloak_user_id", nullable = false, unique = true)
    var keycloakUserId: String = "",  // Keycloak Subject ID (외부 시스템 UUID)

    @Column(nullable = false, unique = true)
    var username: String = "",

    @Column(nullable = false, unique = true)
    var email: String = "",

    var name: String = "",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: UserRole = UserRole.USER  // Realm Role (단일 값)
) : AbsDomain() {

    /**
     * Entity 복사 (copy 메서드)
     */
    fun copy(
        keycloakUserId: String = this.keycloakUserId,
        username: String = this.username,
        email: String = this.email,
        name: String = this.name,
        role: UserRole = this.role
    ): User {
        val copied = User(
            keycloakUserId = keycloakUserId,
            username = username,
            email = email,
            name = name,
            role = role
        )
        copied.id = this.id
        copied.publicId = this.publicId
        copied.createdAt = this.createdAt
        copied.modifiedAt = this.modifiedAt
        return copied
    }

    companion object {
        /**
         * JWT에서 UserEntity 생성
         */
        fun fromJwt(jwt: Jwt): User {
            val keycloakUserId = jwt.subject
            val username = jwt.getClaimAsString("preferred_username") ?: keycloakUserId
            val email = jwt.getClaimAsString("email") ?: "$keycloakUserId@unknown.com"
            val name = jwt.getClaimAsString("name") ?: username

            // Keycloak Realm Roles 추출
            val realmRoles = jwt.getClaimAsMap("realm_access")?.get("roles") as? List<*>
            val roleStrings = realmRoles?.mapNotNull { it as? String } ?: emptyList()

            // 우선순위: ADMIN > DEVELOPER > MERCHANT > VENDOR > SYSTEM > USER
            val role = when {
                roleStrings.contains(UserRole.ADMIN.keycloakRoleName) -> UserRole.ADMIN
                roleStrings.contains(UserRole.DEVELOPER.keycloakRoleName) -> UserRole.DEVELOPER
                roleStrings.contains(UserRole.MERCHANT.keycloakRoleName) -> UserRole.MERCHANT
                roleStrings.contains(UserRole.VENDOR.keycloakRoleName) -> UserRole.VENDOR
                roleStrings.contains(UserRole.SYSTEM.keycloakRoleName) -> UserRole.SYSTEM
                else -> UserRole.USER
            }

            return User(
                keycloakUserId = keycloakUserId,
                username = username,
                email = email,
                name = name,
                role = role
            )
        }
    }
}
