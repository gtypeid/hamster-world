package com.hamsterworld.common.web.filter.support

import org.springframework.stereotype.Component
import org.springframework.web.util.ContentCachingResponseWrapper
import java.nio.charset.StandardCharsets

@Component
class ResponseBodyExtractor {

    fun extract(response: ContentCachingResponseWrapper): String? {
        val content = response.contentAsByteArray
        if (content.isEmpty()) {
            return null
        }

        return String(content, StandardCharsets.UTF_8)
    }
}
