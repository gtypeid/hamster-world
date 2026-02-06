package com.hamsterworld.common.web.filter.support

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component

@Component
class ClientIpResolver {

    companion object {
        private val IP_HEADERS = listOf(
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP"
        )
    }

    fun resolve(request: HttpServletRequest): String {
        val ip = resolveFromXForwardedFor(request)
        if (ip != null) return ip

        val headerIp = resolveFromHeaders(request)
        if (headerIp != null) return headerIp

        return request.remoteAddr ?: "unknown"
    }

    private fun resolveFromXForwardedFor(request: HttpServletRequest): String? {
        val forwarded = request.getHeader("X-Forwarded-For") ?: return null
        return forwarded.split(",").firstOrNull()?.trim()?.takeIf { it != "unknown" }
    }

    private fun resolveFromHeaders(request: HttpServletRequest): String? {
        for (header in IP_HEADERS) {
            val ip = request.getHeader(header)
            if (ip != null && ip != "unknown") {
                return ip
            }
        }
        return null
    }
}
