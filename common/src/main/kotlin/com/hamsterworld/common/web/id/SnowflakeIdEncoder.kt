package com.hamsterworld.common.web.id
import kotlin.text.iterator
object SnowflakeIdEncoder {
    private const val BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
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
    @JvmStatic
    fun isValid(encoded: String): Boolean {
        return encoded.all { it in BASE62_ALPHABET }
    }
}
