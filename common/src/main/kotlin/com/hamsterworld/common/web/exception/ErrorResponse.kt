package com.hamsterworld.common.web.exception

import java.time.LocalDateTime

data class ErrorResponse(
    val status: Int = 0,
    val error: String = "",
    val message: String = "",
    val path: String = "",
    val timestamp: LocalDateTime = LocalDateTime.now()
)
