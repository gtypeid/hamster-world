package com.hamsterworld.common.web.filter.support

import com.hamsterworld.common.web.exception.HttpStatusType
import org.springframework.stereotype.Component

@Component
class ResponseStatusAnalyzer {

    fun analyze(statusCode: Int): ProcessingResult {
        val statusType = HttpStatusType.fromCode(statusCode)

        return when {
            statusCode in 200..299 -> ProcessingResult.success(statusCode)
            statusCode in 400..499 -> ProcessingResult.clientError(
                statusCode,
                statusType?.reason ?: "Client Error"
            )
            statusCode >= 500 -> ProcessingResult.serverError(
                statusCode,
                statusType?.reason ?: "Server Error"
            )
            else -> ProcessingResult.success(statusCode)
        }
    }
}
