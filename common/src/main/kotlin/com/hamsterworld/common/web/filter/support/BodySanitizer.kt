package com.hamsterworld.common.web.filter.support

import org.springframework.stereotype.Component
import java.util.regex.Pattern

@Component
class BodySanitizer {

    companion object {
        private val SENSITIVE_FIELDS = listOf(
            "password", "changePassword", "originPassword",
            "token", "accessToken", "refreshToken",
            "apiKey", "secret", "privateKey", "creditCard"
        )
    }

    fun sanitize(body: String): String {
        var sanitized = body

        for (field in SENSITIVE_FIELDS) {
            sanitized = sanitizeJsonField(sanitized, field)
            sanitized = sanitizeFormField(sanitized, field)
        }

        return sanitized
    }

    private fun sanitizeJsonField(body: String, field: String): String {
        val pattern = Pattern.compile("(\"$field\"\\s*:\\s*\")([^\"]*)(\")") 
        val matcher = pattern.matcher(body)
        return matcher.replaceAll("$1***$3")
    }

    private fun sanitizeFormField(body: String, field: String): String {
        val pattern = Pattern.compile("($field=)([^&]*)")
        val matcher = pattern.matcher(body)
        return matcher.replaceAll("$1***")
    }
}
