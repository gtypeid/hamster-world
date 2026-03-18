package com.hamsterworld.common.external
interface ExternalClientProtocol {
    fun getClientName(): String = this::class.simpleName ?: "UnknownClient"
}
