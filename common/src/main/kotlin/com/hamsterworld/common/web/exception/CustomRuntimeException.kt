package com.hamsterworld.common.web.exception

open class CustomRuntimeException : RuntimeException {
    constructor(message: String) : super(message)
    constructor(message: String, cause: Throwable) : super(message, cause)
}
