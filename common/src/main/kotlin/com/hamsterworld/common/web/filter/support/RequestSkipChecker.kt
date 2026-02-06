package com.hamsterworld.common.web.filter.support

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component

@Component
open class RequestSkipChecker {

    companion object {
        private val SKIP_PATHS = listOf(
            "/swagger-ui",
            "/v3/api-docs",
            "/swagger-resources",
            "/webjars",
            "/favicon.ico",
            "/error"
        )
    }

    open fun shouldSkip(request: HttpServletRequest): Boolean {
        val uri = request.requestURI
        return SKIP_PATHS.any { uri.startsWith(it) }
    }
}
