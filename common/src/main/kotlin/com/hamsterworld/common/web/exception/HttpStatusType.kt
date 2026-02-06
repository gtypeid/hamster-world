package com.hamsterworld.common.web.exception

enum class HttpStatusType(
    val code: Int,
    val reason: String
) {
    BAD_REQUEST(400, "Bad Request"),
    UNAUTHORIZED(401, "Unauthorized"),
    FORBIDDEN(403, "Forbidden"),
    NOT_FOUND(404, "Not Found"),
    PAYLOAD_TOO_LARGE(413, "Payload Too Large"),
    UNSUPPORTED_MEDIA_TYPE(415, "Unsupported Media Type"),
    INTERNAL_SERVER_ERROR(500, "Internal Server Error");

    companion object {
        fun fromCode(code: Int): HttpStatusType? {
            return values().firstOrNull { it.code == code }
                ?: when {
                    code in 400..499 -> BAD_REQUEST
                    code >= 500 -> INTERNAL_SERVER_ERROR
                    else -> null
                }
        }
    }
}
