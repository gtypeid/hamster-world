package com.hamsterworld.common.web.filter.support

object IpValidator {

    private const val IPV4_PATTERN = 
        "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"

    private const val IPV6_PATTERN =
        "^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)$|^::1$|^::$"

    fun isValid(ip: String?): Boolean {
        if (ip.isNullOrBlank()) return false
        return ip.matches(Regex(IPV4_PATTERN)) || ip.matches(Regex(IPV6_PATTERN))
    }
}
