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

/**
 * JWT 인증 후 User 자동 동기화 필터
 *
 * JWT 인증이 성공하면 Keycloak의 사용자 정보를 ecommerce DB에 자동으로 동기화합니다.
 */
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

        // JWT 인증이 성공한 경우에만 처리
        if (authentication is JwtAuthenticationToken) {
            val jwt = authentication.token as Jwt
            val userId = jwt.subject

            try {
                // DB에 사용자가 없으면 JWT에서 정보 추출하여 자동 생성
                val user = userService.findByKeycloakUserId(userId)
                    ?: run {
                        log.info("User not found in DB. Creating from JWT: keycloakUserId=$userId")
                        val newUser = User.fromJwt(jwt)
                        userService.save(newUser)
                    }

                // User 객체를 SecurityContext의 Principal로 설정
                // 이렇게 하면 @AuthenticationPrincipal user: User가 작동함
                val authorities = authentication.authorities
                val userAuthentication = UsernamePasswordAuthenticationToken(
                    user,  // ← User 객체가 Principal
                    null,
                    authorities  // 기존 JWT 권한 유지
                )
                SecurityContextHolder.getContext().authentication = userAuthentication

                log.debug("User synchronized: keycloakUserId=${user.keycloakUserId}, username=${user.username}, role=${user.role}")
            } catch (e: Exception) {
                log.error("Failed to sync user from JWT: userId=$userId", e)
                // 에러 발생해도 요청은 계속 진행 (JWT 인증은 이미 성공)
            }
        }

        filterChain.doFilter(request, response)
    }
}
