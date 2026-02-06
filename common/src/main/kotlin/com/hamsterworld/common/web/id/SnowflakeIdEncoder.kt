package com.hamsterworld.common.web.id

import kotlin.text.iterator

/**
 * Snowflake ID 인코딩/디코딩 유틸리티
 * Base62 인코딩을 사용하여 URL-safe한 문자열 생성
 */
object SnowflakeIdEncoder {

    private const val BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    /**
     * Long ID를 Base62 문자열로 인코딩
     */
    @JvmStatic
    fun encode(value: Long): String {
        if (value == 0L) return "0"

        val sb = StringBuilder()
        var num = value

        while (num > 0) {
            sb.insert(0, BASE62_ALPHABET[(num % 62).toInt()])
            num /= 62
        }

        return sb.toString()
    }

    /**
     * Base62 문자열을 Long ID로 디코딩
     */
    @JvmStatic
    fun decode(encoded: String): Long {
        if (encoded.isEmpty()) return 0L

        var result = 0L
        val base = 62L

        for (char in encoded) {
            val digit = BASE62_ALPHABET.indexOf(char)
            if (digit == -1) {
                throw IllegalArgumentException("Invalid character in encoded string: $char")
            }
            result = result * base + digit
        }

        return result
    }

    /**
     * 인코딩된 문자열이 유효한지 검증
     */
    @JvmStatic
    fun isValid(encoded: String): Boolean {
        return encoded.all { it in BASE62_ALPHABET }
    }
}
