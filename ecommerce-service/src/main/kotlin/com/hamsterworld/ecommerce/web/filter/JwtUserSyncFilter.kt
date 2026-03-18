package com.hamsterworld.ecommerce.web.filter
import com.hamsterworld.ecommerce.domain.user.model.User
import com.hamsterworld.ecommerce.domain.user.service.UserService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
@Component
class JwtUserSyncFilter(
    private val userService: UserService
) : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(javaClass)
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val authentication = SecurityContextHolder.getContext().authentication
        if (authentication is JwtAuthenticationToken) {
            val jwt = authentication.token as Jwt
            val userId = jwt.subject
            try {
                val user = userService.findByKeycloakUserId(userId)
                    ?: run {
                        log.info("User not found in DB. Creating from JWT: keycloakUserId=$userId")
                        val newUser = User.fromJwt(jwt)
                        userService.save(newUser)
                    }
                val authorities = authentication.authorities
                val userAuthentication = UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    authorities
                )
                SecurityContextHolder.getContext().authentication = userAuthentication
                log.debug("User synchronized: keycloakUserId=${user.keycloakUserId}, username=${user.username}, role=${user.role}")
            } catch (e: Exception) {
                log.error("Failed to sync user from JWT: userId=$userId", e)
            }
        }
        filterChain.doFilter(request, response)
    }
}
