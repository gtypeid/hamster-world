package com.hamsterworld.common.web.config

import org.springframework.core.convert.converter.Converter
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter

/**
 * Keycloak JWT Converter 유틸
 *
 * 각 서비스의 SecurityConfig에서 사용:
 * ```
 * oauth2.jwt { jwt ->
 *     jwt.jwtAuthenticationConverter(KeycloakJwtConverter.create())
 * }
 * ```
 */
object KeycloakJwtConverter {

    /**
     * JWT → Authentication 변환기 생성
     *
     * Keycloak JWT 구조:
     * - realm_access.roles: Realm Roles (USER, VENDOR, ADMIN, DEVELOPER, SYSTEM)
     * - resource_access.{client}.roles: Client Roles
     * - scope: OpenID Connect Scopes
     */
    fun create(): JwtAuthenticationConverter {
        val converter = JwtAuthenticationConverter()
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter())
        return converter
    }

    /**
     * JWT에서 Authorities 추출
     *
     * 변환 규칙:
     * - realm_access.roles → ROLE_{role}
     * - resource_access.{client}.roles → {client}_{role}
     * - scope → SCOPE_{scope}
     */
    private fun authoritiesConverter(): Converter<Jwt, Collection<GrantedAuthority>> {
        return Converter { jwt ->
            val authorities = mutableSetOf<GrantedAuthority>()

            // 1. Realm Roles (ROLE_ 접두사)
            val realmAccess = jwt.getClaim<Map<String, Any>>("realm_access") ?: emptyMap()
            val realmRoles = (realmAccess["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            realmRoles.forEach { role ->
                authorities.add(SimpleGrantedAuthority("ROLE_$role"))
            }

            // 2. Client Roles (각 클라이언트별)
            val resourceAccess = jwt.getClaim<Map<String, Any>>("resource_access") ?: emptyMap()
            resourceAccess.forEach { (client, access) ->
                if (access is Map<*, *>) {
                    val roles = (access["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                    roles.forEach { role ->
                        authorities.add(SimpleGrantedAuthority("${client}_${role}"))
                    }
                }
            }

            // 3. Scopes
            val scopes = jwt.getClaimAsString("scope")?.split(" ") ?: emptyList()
            scopes.forEach { scope ->
                authorities.add(SimpleGrantedAuthority("SCOPE_$scope"))
            }

            authorities
        }
    }
}
