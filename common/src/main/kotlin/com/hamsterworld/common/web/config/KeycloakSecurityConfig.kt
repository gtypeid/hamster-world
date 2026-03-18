package com.hamsterworld.common.web.config
import org.springframework.core.convert.converter.Converter
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
object KeycloakJwtConverter {
    fun create(): JwtAuthenticationConverter {
        val converter = JwtAuthenticationConverter()
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter())
        return converter
    }
    private fun authoritiesConverter(): Converter<Jwt, Collection<GrantedAuthority>> {
        return Converter { jwt ->
            val authorities = mutableSetOf<GrantedAuthority>()
            val realmAccess = jwt.getClaim<Map<String, Any>>("realm_access") ?: emptyMap()
            val realmRoles = (realmAccess["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
            realmRoles.forEach { role ->
                authorities.add(SimpleGrantedAuthority("ROLE_$role"))
            }
            val resourceAccess = jwt.getClaim<Map<String, Any>>("resource_access") ?: emptyMap()
            resourceAccess.forEach { (client, access) ->
                if (access is Map<*, *>) {
                    val roles = (access["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                    roles.forEach { role ->
                        authorities.add(SimpleGrantedAuthority("${client}_${role}"))
                    }
                }
            }
            val scopes = jwt.getClaimAsString("scope")?.split(" ") ?: emptyList()
            scopes.forEach { scope ->
                authorities.add(SimpleGrantedAuthority("SCOPE_$scope"))
            }
            authorities
        }
    }
}
