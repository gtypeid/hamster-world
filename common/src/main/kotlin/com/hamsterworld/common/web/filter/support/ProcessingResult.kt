package com.hamsterworld.common.web.filter.support

data class ProcessingResult(
    val responseStatus: Int?,
    val result: String,
    val errorMessage: String?
) {
    companion object {
        fun success(statusCode: Int): ProcessingResult {
            return ProcessingResult(statusCode, "SUCCESS", null)
        }

        fun clientError(statusCode: Int, reason: String): ProcessingResult {
            return ProcessingResult(
                statusCode,
                "CLIENT_ERROR",
                "HTTP $statusCode $reason"
            )
        }

        fun serverError(statusCode: Int, reason: String): ProcessingResult {
            return ProcessingResult(
                statusCode,
                "SERVER_ERROR",
                "HTTP $statusCode $reason"
            )
        }

        fun exception(message: String): ProcessingResult {
            return ProcessingResult(null, "EXCEPTION", message)
        }
    }
}
