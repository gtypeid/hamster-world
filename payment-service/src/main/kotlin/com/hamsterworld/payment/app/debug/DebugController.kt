package com.hamsterworld.payment.app.debug

import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 디버그용 Controller
 *
 * JWT 토큰에서 추출된 인증 정보 확인
 */
@RestController
@RequestMapping("/api/debug")
class DebugController {

    /**
     * 현재 인증 정보 확인
     *
     * GET /api/debug/auth
     */
    @GetMapping("/auth")
    fun getAuthInfo(): Map<String, Any?> {
        val auth: Authentication? = SecurityContextHolder.getContext().authentication
        val authorities: List<String> = auth?.authorities?.map { it.authority } ?: emptyList()

        return mapOf(
            "authenticated" to (auth?.isAuthenticated ?: false),
            "principal" to auth?.principal.toString(),
            "authorities" to authorities,
            "details" to auth?.details.toString()
        )
    }
}
