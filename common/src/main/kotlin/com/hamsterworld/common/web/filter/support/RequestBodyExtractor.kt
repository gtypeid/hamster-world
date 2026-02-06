package com.hamsterworld.common.web.filter.support

import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import org.springframework.web.util.ContentCachingRequestWrapper
import java.nio.charset.StandardCharsets

@Component
class RequestBodyExtractor(
    private val bodySanitizer: BodySanitizer
) {
    fun extract(request: HttpServletRequest): String? {
        if (request !is ContentCachingRequestWrapper) {
            return null
        }

        val content = request.contentAsByteArray
        if (content.isEmpty()) {
            return null
        }

        val body = String(content, StandardCharsets.UTF_8)
        return bodySanitizer.sanitize(body)
    }
}
