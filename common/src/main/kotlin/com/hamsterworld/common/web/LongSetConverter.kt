package com.hamsterworld.common.web

import com.hamsterworld.common.web.exception.CustomRuntimeException
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter
import java.io.IOException

@Converter
class LongSetConverter : AttributeConverter<Set<Long>, String> {

    companion object {
        private val objectMapper = ObjectMapper()
    }

    override fun convertToDatabaseColumn(attribute: Set<Long>?): String {
        if (attribute.isNullOrEmpty()) {
            return "[]"
        }
        return try {
            objectMapper.writeValueAsString(attribute)
        } catch (e: Exception) {
            throw CustomRuntimeException("Set<Long> JSON 변환 중 오류가 발생했습니다: ${e.message}")
        }
    }

    override fun convertToEntityAttribute(dbData: String?): Set<Long> {
        if (dbData.isNullOrBlank()) {
            return emptySet()
        }
        return try {
            objectMapper.readValue(dbData, object : TypeReference<Set<Long>>() {})
        } catch (e: IOException) {
            throw CustomRuntimeException("JSON Set<Long> 변환 중 오류가 발생했습니다: ${e.message}")
        }
    }
}
