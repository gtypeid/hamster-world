package com.hamsterworld.common.web.threadlocal

data class AuditContext(
    val traceId: String,
    val userId: Long? = null,
    val userLoginId: String? = null,
    val userName: String? = null,
    val prev: String? = null,
    val after: String? = null,
    val targetId: Long? = null,
    val targetType: String? = null
)
