package com.hamsterworld.common.web.filter.support

import org.springframework.stereotype.Component

@Component
class ContentTypeChecker {

    companion object {
        private val LOGGABLE_CONTENT_TYPES = listOf(
            "application/json",
            "application/xml",
            "text/",
            "application/x-www-form-urlencoded",
            "multipart/form-data"
        )
    }

    fun isLoggable(contentType: String?): Boolean {
        if (contentType == null) return false
        return LOGGABLE_CONTENT_TYPES.any { contentType.startsWith(it) }
    }
}
